# CIMForge — Architecture

## Overview

CIMForge is a Splunk Technology Add-on (TA) built on the Universal Configuration Console (UCC) framework. It exposes an agentic orchestration layer inside Splunk that autonomously harvests telemetry, generates CIM-compliant field mappings, validates security posture, and packages a deployable TA — all driven by a real-time React UI that visualises every agent transition as it happens.

---

## Monorepo Structure

```
cimforge/
├── packages/
│   ├── cimforge-ui/               # React UI library (@splunk/cimforge-ui)
│   │   ├── src/
│   │   │   ├── CIMforgeAgentSection.jsx    # Agentic console wrapper (state owner)
│   │   │   ├── MissionControlPanel.jsx     # Live agent-card status panel
│   │   │   ├── DependencyGraph.jsx         # Animated SVG pipeline graph
│   │   │   ├── ExecutiveSummary.jsx        # Post-run KPI cards
│   │   │   ├── BusinessImpactCard.jsx      # ROI metrics panel
│   │   │   └── SponsorBadgeBar.jsx         # Technology badge strip
│   │   └── demo/                           # Standalone webpack dev server (port 8084)
│   └── cimforge-app/              # Splunk page wrapper (@splunk/cimforge-app)
│       └── src/main/webapp/       # Entry point — mounts CIMforgeAgentSection in Splunk
├── cimforge/                      # Deployed Splunk app
│   ├── bin/
│   │   ├── cimforge_generate.py   # Agentic orchestration REST handler (primary)
│   │   ├── cimforge_report_pdf.py # Executive PDF report generator
│   │   ├── ai_detection.py        # AI field-extraction REST handler
│   │   ├── cim_mapping.py         # AI CIM-mapping REST handler
│   │   └── pii_detection.py       # PII detection + redaction REST handler
│   ├── default/
│   │   ├── restmap.conf           # REST endpoint registration
│   │   ├── web.conf               # Splunk web expose stanzas
│   │   └── cimforge_settings.conf # App configuration schema
│   ├── appserver/
│   │   ├── static/pages/main.js   # Compiled frontend bundle
│   │   └── templates/main.html    # Splunk page template
│   └── lib/
│       ├── pii_detection_logic.py # Core PII detection engine
│       └── ip_address_detector.py # Custom IP address detector
├── docs/                          # All documentation
├── .github/workflows/             # CI/CD pipeline
├── package.json                   # Lerna + Yarn workspace root
└── lerna.json
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18, Splunk React UI v5 |
| Styling | Styled Components, pure inline styles |
| Build toolchain | Webpack 5, Babel, Lerna, Yarn Workspaces |
| Splunk app shell | UCC Framework (splunk-add-on-ucc-framework) |
| Backend language | Python 3.9 |
| REST framework | `PersistentServerConnectionApplication` |
| AI provider | OpenRouter (OpenAI-compatible endpoint) |
| PII detection | scrubadub + custom detectors |
| CI/CD | GitHub Actions + Splunk AppInspect |

---

## Frontend Architecture

### State Management

All agentic state lives in `CIMForgeSection`. It owns the full forge lifecycle:

```
CIMForgeSection (state owner)
├── sourcetype, targetDatamodel       — user inputs
├── agenticLogs[]                     — raw logs from backend
├── displayedLogs[]                   — logs revealed one by one (600ms timer)
├── currentLogIndex                   — drives DependencyGraph.activeLogIndex
├── isTyping                          — true while logs are animating
└── configOutput, downloadUrl         — final artifacts
```

Child components receive only what they need:

```
CIMForgeSection
├── SponsorBadgeBar         (static)
├── CIMForgeSection header + status dot
├── [Left column 55%]
│   ├── Form inputs (sourcetype, targetDatamodel)
│   ├── Forge / Reset buttons + Demo Mode checkbox
│   ├── MissionControlPanel (agenticLogs=displayedLogs)
│   └── DependencyGraph (activeStage=deriveStage(displayedLogs))
└── [Right column 45%]
    ├── BusinessImpactCard (static)
    └── ExecutiveSummary (configOutput) — shown when isDone
```

### Agent State Machine (MissionControlPanel)

Each of the 4 agent cards derives its state from `displayedLogs` using `getCardState()`:

```
Idle     →  no matching log tag seen yet
Active   →  matching tag found, no DONE or next-agent tag follows
Complete →  matching tag found AND (DONE in subsequent logs OR next agent tag seen)
```

Visual encoding:

| State | Border | Dot | Animation |
|---|---|---|---|
| Idle | `#30363D` gray | gray | none |
| Active | `#FFB800` yellow | yellow | pulsing box-shadow |
| Complete | `#65A637` green | green | none |

### DependencyGraph Stage Mapping

```
null      → Source Logs glow only (blue #58A6FF)
"mcp"     → MCP Agent active (yellow), Source→MCP line green + traveling dot
"saia"    → MCP complete, SAIA active, lines green up to SAIA
"security"→ SAIA complete, Security active
"sdk"     → Security complete, TA Package active
"done"    → All nodes green, all lines green including shortcut
```

---

## Backend Architecture

### REST Endpoints

| Endpoint | Handler | Purpose |
|---|---|---|
| `POST /cimforge_generate` | `cimforge_generate.py` | Agentic orchestration (primary) |
| `POST /ai_detection` | `ai_detection.py` | AI field extraction via LLM |
| `POST /cim_mapping` | `cim_mapping.py` | CIM field mapping via LLM |
| `POST /pii_detection` | `pii_detection.py` | PII scanning + redaction rules |

All handlers extend `PersistentServerConnectionApplication` and authenticate via Splunk session tokens.

### cimforge_generate.py — Agentic Orchestration

The primary endpoint receives `{ sourcetype, target_datamodel }` and returns:

```json
{
  "payload": {
    "agentic_logs": [ "...", "...", "...", "...", "...", "..." ],
    "config_output": "[cimforge_custom]\nEXTRACT-...",
    "download_url": "/static/app/cimforge/TA-cimforge-{sourcetype}.tar.gz"
  },
  "status": 200
}
```

The 6-entry log sequence maps directly to the 4 agents:

```python
[MCP]       → MCP Harvester       (2 logs: connect + retrieve)
[SAIA]      → SAIA Mapper         (1 log: CIM mapping generation)
[CORE]      → Internal validation (1 log: regex matching stats)
[SEC-MODEL] → Security Validator  (1 log: ReDoS scan)
[SDK]       → TA Packager         (1 log: packaging + DONE signal)
```

### Credential & Settings Access

AI API keys are stored in the Splunk credential store under the realm:
```
__REST_CREDENTIAL__#cimforge#configs/conf-cimforge_settings
```
Accessed via `solnlib.conf_manager.ConfManager`.

---

## The 4 Agents

### [MCP] MCP Harvester
- **Role**: Connects to Splunk via the MCP (Model Context Protocol) pattern, queries the target index for up to 20 raw events matching the specified sourcetype.
- **Input**: sourcetype, index
- **Output**: Raw event sample for downstream processing
- **Tech**: Splunk search API via `splunklib.client`

### [SAIA] SAIA Mapper
- **Role**: The Splunk AI Autonomous (SAIA) agent generates CIM field mappings by analysing the raw events against the target data model schema. Uses the configured LLM via OpenRouter.
- **Input**: Raw events, target data model name
- **Output**: `FIELDALIAS` and `EVAL` stanzas for `props.conf`
- **Tech**: OpenRouter API (OpenAI-compatible), `cim_mapping.py`

### [SEC] Security Validator
- **Role**: Applies the Cisco Foundation Security Model checks to all generated regex patterns. Scans for ReDoS (Regular Expression Denial of Service) vulnerabilities using catastrophic backtracking analysis.
- **Input**: Generated `EXTRACT-` regex patterns
- **Output**: Pass/fail verdict per pattern; redacts unsafe patterns
- **Tech**: `ucc-app/lib/pii_detection_logic.py`, custom ReDoS heuristics

### [SDK] TA Packager
- **Role**: Assembles the generated configuration files (`props.conf`, `eventtypes.conf`, `tags.conf`, `app.conf`) into a Splunk-installable TA directory, then archives it as `TA-cimforge-{sourcetype}.tar.gz`.
- **Input**: All generated config stanzas
- **Output**: Downloadable `.tar.gz` TA package
- **Tech**: Python `tarfile`, UCC packaging conventions

---

## Data Flow Summary

```
Browser                    Splunk REST Layer              AI Provider
───────                    ─────────────────              ───────────
User fills form
    │
    ▼
POST /cimforge_generate ──▶ cimforge_generate.py
                                │
                                ├── Query Splunk events ──▶ splunkd
                                ├── LLM CIM mapping ──────▶ OpenRouter
                                ├── ReDoS validation
                                └── Package TA
                                         │
                            ◀── JSON payload ──────────────
    │
    ▼
displayedLogs revealed
at 600ms intervals
    │
    ├── MissionControlPanel cards pulse → complete
    ├── DependencyGraph nodes light up sequentially
    └── ExecutiveSummary KPIs render on DONE
```

---

## Security Considerations

- All API keys stored in Splunk's encrypted credential store — never in config files
- PII is never logged; only text length and a hash are recorded
- Generated regex patterns scanned for ReDoS before packaging
- CSRF protection via `X-Splunk-Form-Key` header on all POST requests
- Splunk session-based authentication for all REST handlers
