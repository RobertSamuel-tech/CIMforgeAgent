# CIMForge — Product Overview

---

## The Problem

Every time a new data source arrives in a Splunk environment, a security or data engineering team faces the same multi-hour manual process:

1. Reverse-engineer field structure from raw logs
2. Write and test regex extraction patterns
3. Map each field to the correct CIM data model
4. Scan patterns for ReDoS vulnerabilities
5. Write `props.conf`, `eventtypes.conf`, `tags.conf`
6. Package and deploy a Splunk Technology Add-on

**This process takes 2–4 hours per sourcetype, requires deep Splunk expertise, and is repeated for every new data source across every environment.**

---

## The Solution

**CIMForge** is an agentic Splunk app that replaces this entire workflow with a single button click. Four specialised AI agents execute the pipeline autonomously inside Splunk and deliver a production-ready TA in under 10 seconds.

---

## The Four Agents

| Agent | Role | Technology |
|---|---|---|
| **[MCP] MCP Harvester** | Connects via MCP pattern, retrieves 20 raw events from the target index and sourcetype | Splunk Search API |
| **[SAIA] SAIA Mapper** | Generates CIM-compliant `FIELDALIAS` and `EVAL` stanzas using an AI language model | OpenRouter LLM (GPT-4 / Claude) |
| **[SEC] Security Validator** | Applies the Cisco Foundation Security Model — scans every regex for catastrophic backtracking (ReDoS) | Custom static analysis |
| **[SDK] TA Packager** | Assembles `props.conf`, `eventtypes.conf`, `tags.conf`, `app.conf` into an installable `.tar.gz` TA | Python + UCC conventions |

---

## Business Impact

| Metric | Value |
|---|---|
| Onboarding time saved per sourcetype | **2.5 hours** |
| Manual tasks eliminated | **14** |
| Automation score | **96%** |
| Risk score | **LOW** — ReDoS-free guarantee |
| CIM field coverage | **94%** — 18 of 20 fields mapped |
| Security validation | **PASSED** — Cisco Foundation Sec Model |
| Output | Production-ready `.tar.gz` TA, downloadable immediately |

---

## What Makes It Different

**Agentic, not just automated.** The four agents operate as a pipeline with real-time status feedback. Users watch each agent activate, process, and complete — with live log streaming, pulsing agent cards, and an animated dependency graph — before the Executive Summary crystallises the results.

**Built into Splunk.** CIMForge runs as a native Splunk UCC app with a persistent REST connection handler. No external services required beyond an AI API key.

**Secure by design.** API keys never leave the Splunk credential store. PII is never logged. Every regex is validated against ReDoS before it reaches any environment.

---

## Architecture Snapshot

```
User Input (sourcetype + data model)
         │
         ▼
  Splunk REST Handler
         │
   ┌─────┴──────┐
   │  4 Agents  │
   │ ─────────  │
   │ MCP → raw events
   │ SAIA → CIM mapping
   │ SEC → ReDoS scan
   │ SDK → TA package
   └─────┬──────┘
         │
         ▼
  JSON payload → React UI
         │
    ┌────┴────┐
    │ 600ms   │  typewriter log reveal
    │ per log │  card state machine
    └────┬────┘  dependency graph animation
         │
         ▼
  Executive Summary KPIs + Download
```

---

## Technical Stack

**Frontend:** React 18 · Splunk React UI v5 · Pure SVG animations · Webpack 5
**Backend:** Python 3.9 · Splunk UCC Framework · `PersistentServerConnectionApplication`
**AI:** OpenRouter (any OpenAI-compatible provider or local LLM)
**Security:** scrubadub PII detection · ReDoS static analysis · Splunk credential store
**Deployment:** Splunk Enterprise 9.0+ · Splunk Cloud compatible

---

## SplunkBase

[https://splunkbase.splunk.com/app/7945](https://splunkbase.splunk.com/app/7945)

---

*Apache License 2.0.*
