# CIMForge — System Architecture

> **Autonomous AI pipeline: raw security logs → validated, deployable Splunk Technology Add-on in under 30 seconds. No human review cycle. Zero manual editing.**

![CIMForge Architecture](architecture_diagram.png)

---

## Architecture Overview

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'primaryColor': '#1e3a5f', 'primaryTextColor': '#e0e0e0', 'primaryBorderColor': '#4fc3f7', 'lineColor': '#4fc3f7', 'secondaryColor': '#0d2137', 'tertiaryColor': '#0a1929', 'clusterBkg': '#0d2137', 'clusterBorder': '#1e3a5f', 'titleColor': '#4fc3f7', 'edgeLabelBackground': '#0d2137', 'fontFamily': 'monospace', 'fontSize': '13px'}}}%%
flowchart TB
    classDef user     fill:#0a1929,stroke:#ef5350,color:#ef9a9a,font-weight:bold
    classDef ui       fill:#0d2137,stroke:#5c6bc0,color:#9fa8da,font-weight:bold
    classDef platform fill:#003d3d,stroke:#26c6da,color:#80deea,font-weight:bold
    classDef mcp      fill:#0a2b1a,stroke:#66bb6a,color:#a5d6a7,font-weight:bold
    classDef saia     fill:#1c0a3b,stroke:#ba68c8,color:#e1bee7,font-weight:bold
    classDef sec      fill:#3b0a0a,stroke:#ef5350,color:#ffcdd2,font-weight:bold
    classDef sdk      fill:#3b1a0a,stroke:#ffa726,color:#ffe0b2,font-weight:bold
    classDef llm      fill:#0a1429,stroke:#42a5f5,color:#bbdefb,font-weight:bold
    classDef pii      fill:#1f0a2b,stroke:#f06292,color:#fce4ec,font-weight:bold
    classDef artifact fill:#3b2b00,stroke:#ffd54f,color:#fff9c4,font-weight:bold,stroke-width:3px
    classDef cim      fill:#003d3d,stroke:#26c6da,color:#80deea

    ENGINEER(["SECURITY ENGINEER / SPLUNK ADMIN"]):::user

    subgraph UI_LAYER ["MISSION CONTROL CONSOLE  |  React 18  |  Splunk React UI v5  |  Styled Components"]
        FORM["Input Panel\nsourcetype\ntarget_datamodel"]:::ui
        subgraph LIVE_VIZ ["LIVE AGENTIC VISUALIZATION  |  600ms Step Animation  |  Real-Time State"]
            C1["MCP HARVESTER\nidle > active > done"]:::mcp
            C2["SAIA MAPPER\nidle > active > done"]:::saia
            C3["SEC VALIDATOR\nidle > active > done"]:::sec
            C4["SDK PACKAGER\nidle > active > done"]:::sdk
        end
        DGRAPH["DependencyGraph SVG\nAnimated nodes and edges\nColor state transitions"]:::ui
        EXSUM["ExecutiveSummary KPIs\n18 of 20 fields matched\n96% automation score\n2.5 hrs saved per sourcetype\nZero ReDoS detected"]:::ui
    end

    subgraph SPLUNK ["SPLUNK ENTERPRISE PLATFORM  |  Python 3.9  |  Persistent REST Handlers  |  solnlib  |  splunklib"]
        REST["POST /cimforge_generate\nPersistentServerConnectionApp\nCSRF protected + Session token auth"]:::platform
        CREDSTORE["Credential Store\nEncrypted API Keys\nsolnlib.conf_manager\nSplunk keystore realm"]:::platform
        SAPI["Splunk Search API\nsplunklib.client\nindex=* sourcetype=S\nhead 20 fields _raw"]:::platform
    end

    subgraph PIPELINE ["AUTONOMOUS AGENT PIPELINE  |  SEQUENTIAL  |  SELF-VALIDATING  |  UNDER 30 SECONDS END-TO-END"]
        direction LR
        MCP_A["MCP HARVESTER AGENT\nTelemetry Collection\nSplunk Search API\nCaptures 20 raw events\nBuilds event corpus"]:::mcp
        SAIA_A["SAIA MAPPER AGENT\nLLM-Powered CIM Mapping\nOpenRouter API inference\nCIM field extraction\nFIELDALIAS + EVAL + EXTRACT\nprops.conf stanza generation"]:::saia
        SEC_A["SEC VALIDATOR AGENT\nSecurity Pattern Scan\nReDoS vulnerability check\nCatastrophic backtracking\nNamed capture group verify\nPCRE compatibility check"]:::sec
        SDK_A["SDK PACKAGER AGENT\nTA Artifact Assembly\nDirectory tree scaffold\nConfig file serialization\ntar.gz compression\nDownload URL generation"]:::sdk
        MCP_A -->|"20 raw log events"| SAIA_A
        SAIA_A -->|"CIM field mappings + regex"| SEC_A
        SEC_A -->|"validated config stanzas"| SDK_A
    end

    subgraph LLM_LAYER ["MULTI-MODEL LLM ABSTRACTION  |  OpenRouter API  |  Configurable Endpoint  |  Model-Agnostic"]
        OR["openrouter.ai\napi/v1/chat/completions"]:::llm
        GPT["GPT-4\nOpenAI"]:::llm
        CLAUD["Claude 3.5 Sonnet\nAnthropic"]:::llm
        MISTR["Mistral\nMistral AI"]:::llm
        OLL["Ollama\nLocal / Air-gapped"]:::llm
        HEUR["Heuristic Fallback\nOffline mode\nNo API required"]:::llm
        OR --> GPT
        OR --> CLAUD
        OR --> MISTR
        OR --> OLL
        OR -.->|"no API"| HEUR
    end

    subgraph PII_STACK ["PII DETECTION ENGINE  |  18 Detector Types  |  Enterprise-Grade Privacy Protection"]
        SCRUB["scrubadub\nCore Masking Engine"]:::pii
        PRESID["Microsoft Presidio 2.2\nNamed Entity Recognition"]:::pii
        SPAC["spaCy 3.8\nen_core_web_md NLP"]:::pii
        IPDET["Custom IP Detector\nProprietary Patterns"]:::pii
        SCRUB --> PRESID
        PRESID --> SPAC
        SCRUB --- IPDET
    end

    subgraph ARTIFACTS ["DEPLOYMENT ARTIFACTS  |  PRODUCTION-READY  |  IMMEDIATELY INSTALLABLE"]
        direction LR
        TA["TA-cimforge-sourcetype.tar.gz\nprops.conf + eventtypes.conf + tags.conf + app.conf\nDrop into Splunk apps dir  Zero manual editing"]:::artifact
        PDF["Executive PDF Report\nAgent execution timeline\nField coverage metrics\nSecurity verdict + Business ROI"]:::artifact
    end

    CIM["10 CIM DATA MODELS  |  AUTO-TAGGED  |  SCHEMA-VALIDATED\nAuthentication  Web  Network Traffic  Malware  Vulnerability\nEndpoint  Email  Change Analysis  Database  Application State"]:::cim

    ENGINEER      -->|"sourcetype + target_datamodel"| FORM
    FORM          -->|"HTTP POST  CSRF-protected  Splunk session token"| REST
    CREDSTORE     -->|"decrypt + inject API key"| REST
    REST          -->|"trigger sequential pipeline"| MCP_A
    MCP_A        <-->|"search query  raw events"| SAPI
    SAIA_A        -->|"LLM inference request"| OR
    SEC_A         -->|"regex pattern analysis"| SCRUB
    SDK_A         -->|"write compressed archive"| TA
    REST          -->|"reportlab PDF generation"| PDF
    TA            -->|"CIM-tagged  ready to query"| CIM
    REST          -->|"JSON  agentic_logs + config_output + download_url"| LIVE_VIZ
    LIVE_VIZ     -.->|"600ms animation steps"| DGRAPH
    LIVE_VIZ     -.->|"on SDK DONE signal"| EXSUM
```

---

## Component Legend

| Color | Layer | Components |
|---|---|---|
| 🟥 Red border | Entry point | Security Engineer |
| 🟦 Indigo | UI / Console | Mission Control React app, Input Panel, DependencyGraph, ExecutiveSummary |
| 🩵 Cyan | Splunk Platform | REST handler, Credential Store, Search API |
| 🟩 Green | MCP Agent | Telemetry harvester, event corpus builder |
| 🟣 Purple | SAIA Agent | LLM mapper, CIM field extractor, props.conf generator |
| 🔴 Red | SEC Agent | ReDoS scanner, pattern validator, PCRE checker |
| 🟠 Orange | SDK Agent | TA packager, tar.gz builder, URL generator |
| 🔵 Blue | LLM Abstraction | OpenRouter, GPT-4, Claude 3.5, Mistral, Ollama, Heuristic fallback |
| 🩷 Pink | PII Engine | scrubadub, Presidio 2.2, spaCy, Custom IP detector |
| 🟡 Gold | Artifacts | TA `.tar.gz` package, Executive PDF report |
| 🩵 Cyan | CIM Models | 10 supported data models, auto-tagged, schema-validated |

---

## Key Data Flows

| Flow | Description |
|---|---|
| **Input → REST** | HTTP POST with CSRF token + Splunk session auth |
| **Credential injection** | API key decrypted from Splunk keystore at runtime, never logged |
| **MCP ↔ Search API** | Bidirectional: query sent → raw events returned |
| **SAIA → OpenRouter** | Event corpus + CIM schema sent to LLM; returns structured mappings |
| **SEC → PII Engine** | All generated regex patterns routed through privacy/security scan |
| **SDK → TA Package** | Validated configs assembled into installable `.tar.gz` in one pass |
| **REST → UI** | Full `agentic_logs[]`, `config_output`, and `download_url` returned as JSON |
| **UI animation** | 600ms step timer reveals agent logs sequentially; status cards update state |

---

## Innovation Highlights

- **Autonomous end-to-end**: zero human review required between raw logs and deployable TA
- **Self-validating pipeline**: ReDoS scanning and field coverage validation built into the pipeline itself
- **Model-agnostic LLM**: swap GPT-4 / Claude / Mistral / local Ollama without code changes
- **Real-time mission control**: animated agent status visible to operator during the 30-second run
- **Production artifact output**: `.tar.gz` drop-in install, not a suggestion or a report
- **Heuristic fallback**: system degrades gracefully with no LLM API — pattern library still operates
- **Privacy-first**: PII scrubbed from event samples before any LLM call via Presidio + scrubadub

---

*Source: [`architecture_diagram.mmd`](architecture_diagram.mmd) — render locally with `npx @mermaid-js/mermaid-cli -i architecture_diagram.mmd -o architecture_diagram.png --theme dark --backgroundColor "#0a1929" --width 2400`*
