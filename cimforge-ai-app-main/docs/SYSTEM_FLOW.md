# CIMForge — System Flow

## End-to-End Data Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  USER                                                                       │
│                                                                             │
│  1. Opens CIMForge in Splunk browser                                  │
│  2. Enters:  Sourcetype = "acme_firewall"                                  │
│              Target Data Model = "Network Traffic"                          │
│  3. Clicks  [ Forge Configuration ]                                         │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │  HTTP POST
                            │  /servicesNS/-/cimforge/cimforge_generate
                            │  { sourcetype, target_datamodel }
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SPLUNK REST LAYER  (cimforge_generate.py)                                 │
│                                                                             │
│  • Validates required fields (400 if missing)                              │
│  • Reads AI API key from credential store                                  │
│  • Orchestrates 4 agents sequentially                                      │
└──────┬──────────────┬──────────────┬──────────────┬───────────────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
  ┌─────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐
  │  [MCP]  │   │  [SAIA]  │  │  [SEC]   │  │  [SDK]   │
  │Harvester│──▶│  Mapper  │──▶Validator │──▶ Packager │
  └─────────┘   └──────────┘  └──────────┘  └──────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
  Retrieve 20   Generate CIM   Scan regex    Package TA
  raw events    mapping stanzas for ReDoS    .tar.gz
  from index=*  via LLM        vulnerabilities
```

---

## Agent-by-Agent Breakdown

### Stage 1 — [MCP] MCP Harvester

```
Input:   sourcetype="acme_firewall", index=*
Action:  Connects to Splunk search API
         Runs: search index=* sourcetype="acme_firewall" | head 20
         Extracts raw _raw field from each result
Output:  20 raw log events (sample corpus)

Log emitted:
  "[MCP] Connected. Harvesting events for sourcetype 'acme_firewall'..."
  "[MCP] Retrieved 20 raw events from index=*."
```

### Stage 2 — [SAIA] SAIA Mapper

```
Input:   20 raw events + target_datamodel="Network Traffic"
Action:  Constructs LLM prompt with CIM field definitions
         for the target data model
         Calls OpenRouter API (GPT-4 / Claude / local)
         Parses response → FIELDALIAS + EVAL stanzas
Output:  CIM field mapping configuration block

Log emitted:
  "[SAIA] Generating CIM mapping for datamodel: Network Traffic..."
```

### Stage 3 — [CORE] Internal Validator

```
Input:   Generated field mappings
Action:  Runs regex patterns against raw events
         Reports match rate (18/20 = 90% in typical run)
Output:  Validated patterns, confidence score

Log emitted:
  "[CORE] Validating regex extraction against raw events... 18/20 fields matched."
```

### Stage 4 — [SEC-MODEL] Security Validator

```
Input:   All EXTRACT-* regex patterns
Action:  Applies Cisco Foundation Security Model checks
         Analyses patterns for catastrophic backtracking (ReDoS)
         Checks: alternation depth, repetition nesting, anchoring
Output:  Pass/fail per pattern; unsafe patterns flagged

Log emitted:
  "[SEC-MODEL] Scanning for ReDoS vulnerabilities... Clear."
```

### Stage 5 — [SDK] TA Packager

```
Input:   props.conf stanzas, eventtypes.conf, tags.conf, app.conf
Action:  Creates TA directory: TA-cimforge-{sourcetype}/
         Writes all config files
         Archives: tar -czf TA-cimforge-{sourcetype}.tar.gz
Output:  Downloadable Splunk TA package

Log emitted:
  "[SDK] Packaging TA-cimforge-custom.tar.gz... DONE."
```

---

## Response Payload

```json
{
  "payload": {
    "agentic_logs": [
      "[MCP] Connected. Harvesting events for sourcetype 'acme_firewall'...",
      "[MCP] Retrieved 20 raw events from index=*.",
      "[SAIA] Generating CIM mapping for datamodel: Network Traffic...",
      "[CORE] Validating regex extraction against raw events... 18/20 fields matched.",
      "[SEC-MODEL] Scanning for ReDoS vulnerabilities... Clear.",
      "[SDK] Packaging TA-cimforge-custom.tar.gz... DONE."
    ],
    "config_output": "[cimforge_custom]\nEXTRACT-src_ip = (?<src_ip>\\d+\\.\\d+\\.\\d+\\.\\d+)\nEXTRACT-status = (?<status>\\d{3})\nEXTRACT-user = (?<user>\\w+)\nFIELDALIAS-src = src_ip as src\nFIELDALIAS-dest = status as dest\nEVAL-action = case(status>=200 AND status<300, \"success\", status>=400, \"failure\")",
    "download_url": "/static/app/cimforge/TA-cimforge-acme_firewall.tar.gz"
  },
  "status": 200
}
```

---

## UI Animation Timeline

Once the response arrives, the frontend drives a typewriter reveal:

```
t=0ms    Response received
         agenticLogs[6] stored in state
         isTyping = true

t=600ms  Log 0 revealed → MCP card: Idle → Active (yellow pulse)
         DependencyGraph: Source Logs glow, MCP node yellow

t=1200ms Log 1 revealed → MCP card: still Active
         (second [MCP] log, same stage)

t=1800ms Log 2 revealed → [SAIA] tag detected
         MCP card: Active → Complete (green)
         SAIA card: Idle → Active (yellow pulse)
         DependencyGraph: MCP node green, SAIA node yellow
         Source→MCP line: green + traveling dot

t=2400ms Log 3 revealed → [CORE] tag (no card match)
         SAIA card: remains Active

t=3000ms Log 4 revealed → [SEC-MODEL] tag detected
         SAIA card: Active → Complete
         Security Validator card: Idle → Active
         DependencyGraph: SAIA node green, Security yellow

t=3600ms Log 5 revealed → [SDK] + DONE detected
         Security card: Active → Complete
         TA Packager card: Idle → Active → Complete
         DependencyGraph: ALL nodes green, ALL lines green
         isTyping = false
         ExecutiveSummary: APPEARS
         Status banner: "Autonomous Processing Complete — TA Package Ready"
```

---

## Generated TA Structure

```
TA-cimforge-acme_firewall/
└── default/
    ├── app.conf          # App metadata (label, version)
    ├── props.conf        # EXTRACT, FIELDALIAS, EVAL rules
    └── tags.conf         # CIM event type tags (network = enabled)
```

Packaged as: `TA-cimforge-acme_firewall.tar.gz`
Served from: `/static/app/cimforge/TA-cimforge-acme_firewall.tar.gz`
Install to: `$SPLUNK_HOME/etc/apps/`

---

## Error States

| Condition | HTTP Status | UI Behaviour |
|---|---|---|
| Missing `sourcetype` | 400 | Red error text below button |
| Missing `target_datamodel` | 400 | Red error text below button |
| AI provider unreachable | 500 | Error with provider hint |
| Invalid JSON body | 400 | Error with field list |
| Demo Mode enabled | N/A | Canned payload used; no network call |

---

## Demo Mode Fast Path

When **Demo Mode** is checked, the API call is bypassed entirely. The frontend loads the pre-canned `DEMO_PAYLOAD` directly into state and starts the animation timer — making the full agentic sequence visible without a running Splunk backend.

```javascript
// CIMForgeSection.jsx
if (demoMode) {
    setAgenticLogs(DEMO_PAYLOAD.agentic_logs);
    setConfigOutput(DEMO_PAYLOAD.config_output);
    setDownloadUrl(DEMO_PAYLOAD.download_url);
    setIsTyping(true);
    return;
}
```
