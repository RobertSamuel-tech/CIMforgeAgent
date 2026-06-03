# CIMForge — Demo Script

## Setup Checklist (Before Recording)

- [ ] Splunk running at `http://localhost:8000`
- [ ] Logged in as admin
- [ ] Browser open at `http://localhost:8000/en-US/app/cimforge/main`
- [ ] Window width ≥ 1400px (full layout visible)
- [ ] Sourcetype pre-filled: `acme_firewall`
- [ ] Target Data Model pre-filled: `Network Traffic`
- [ ] Scroll position: top of page

---

## Scene 1 — The Problem (0:00–0:30)

**Narration:**
> "Every time a new data source arrives in Splunk, a security engineer spends hours manually writing regex, mapping CIM fields, and packaging a TA. It's repetitive, error-prone, and it doesn't scale."

**Screen action:** Show a long hand-written `props.conf` file.

---

## Scene 2 — CIMForge Agentic Console (0:30–1:00)

**Narration:**
> "CIMForge replaces the entire workflow with a single button press. Four AI agents run autonomously inside Splunk."

**Screen action:**
1. Show the **CIMForge Agentic Operations Console** in full
2. Point out the four agent cards, Business Impact panel, and agent timeline

---

## Scene 3 — Forge Configuration (1:00–1:45)

**Narration:**
> "We enter a sourcetype and a target CIM data model — and click Forge Configuration."

**Screen action:**
1. Show `acme_firewall` in the Sourcetype field
2. Show `Network Traffic` in the Target Data Model field
3. Click **[ Forge Configuration ]**
4. Watch agent cards activate one by one: MCP → SAIA → SEC → SDK
5. Watch the animated dependency graph light up
6. Watch the Agent Timeline fill with log entries in real time

---

## Scene 4 — Results (1:45–2:30)

**Narration:**
> "In under 10 seconds, the pipeline completes. The Executive Summary shows risk score LOW, CIM coverage 94%, security PASSED, and the package is READY."

**Screen action:**
1. Show the completed Executive Summary KPI cards
2. Show the Generated Configuration Preview with real `props.conf` content
3. Click **[ Download TA Package ]** — `TA-cimforge-acme_firewall.tar.gz` downloads
4. Click **[ Download Executive Report PDF ]** — two-page PDF downloads

---

## Scene 5 — Business Impact (2:30–3:00)

**Narration:**
> "2.5 hours of manual work eliminated in under 10 seconds. 14 manual tasks replaced by four agents. 96% automation score."

**Screen action:** Highlight the Business Impact panel with the three metrics.

---

## Talking Points

- **Agentic, not just automated** — agents operate as a pipeline with real-time status feedback
- **Secure by design** — API keys stay in Splunk's credential store; PII never logged; every regex is ReDoS-scanned
- **Splunk-native** — runs inside Splunk as a persistent REST handler; no external services required
- **Executive output** — PDF report with cover page, agent timeline, and generated config ready for stakeholders
