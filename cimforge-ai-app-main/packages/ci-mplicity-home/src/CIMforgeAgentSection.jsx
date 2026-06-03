import React, { useState, useEffect } from 'react';
import MissionControlPanel from './MissionControlPanel';
import DependencyGraph from './DependencyGraph';
import ExecutiveSummary from './ExecutiveSummary';
import SponsorBadgeBar from './SponsorBadgeBar';
import BusinessImpactCard from './BusinessImpactCard';

const DEMO_PAYLOAD = {
    agentic_logs: [
        "[MCP] Connected. Harvesting events for sourcetype 'acme_firewall'...",
        "[MCP] Retrieved 20 raw events from index=*.",
        "[SAIA] Generating CIM mapping for datamodel: Network Traffic...",
        "[CORE] Validating regex extraction against raw events... 18/20 fields matched.",
        "[SEC-MODEL] Scanning for ReDoS vulnerabilities... Clear.",
        "[SDK] Packaging TA-cimforge-custom.tar.gz... DONE.",
    ],
    config_output: "[cimforge_custom]\nEXTRACT-src_ip = (?<src_ip>\\d+\\.\\d+\\.\\d+\\.\\d+)\nEXTRACT-status = (?<status>\\d{3})\nFIELDALIAS-src = src_ip as src",
    download_url: "/static/app/cimforge/TA-cimforge-acme_firewall.tar.gz",
};

function getSplunkCsrfToken() {
    const match = document.cookie.match(/splunkweb_csrf_token_\d+=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

function deriveStage(logs) {
    for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i];
        if (log.includes('DONE')) return 'done';
        if (log.includes('[SDK]')) return 'sdk';
        if (log.includes('[SEC-MODEL]') || log.includes('[SEC]')) return 'security';
        if (log.includes('[SAIA]')) return 'saia';
        if (log.includes('[MCP]')) return 'mcp';
    }
    return null;
}

const INPUT_STYLE = {
    width:           '100%',
    padding:         '8px 10px',
    marginTop:       '4px',
    background:      '#161B22',
    border:          '1px solid #30363D',
    color:           '#E6EDF3',
    fontSize:        '13px',
    borderRadius:    '4px',
    boxSizing:       'border-box',
    outline:         'none',
};

const CIMforgeAgentSection = () => {
    const [sourcetype,      setSourcetype]      = useState('acme_firewall');
    const [targetDatamodel, setTargetDatamodel] = useState('Network Traffic');
    const [agenticLogs,     setAgenticLogs]     = useState([]);
    const [configOutput,    setConfigOutput]    = useState('');
    const [downloadUrl,     setDownloadUrl]     = useState('');
    const [error,           setError]           = useState('');
    const [loading,         setLoading]         = useState(false);
    const [displayedLogs,   setDisplayedLogs]   = useState([]);
    const [currentLogIndex, setCurrentLogIndex] = useState(0);
    const [isTyping,        setIsTyping]        = useState(false);
    const [reportLoading,   setReportLoading]   = useState(false);
    const [reportError,     setReportError]     = useState('');

    const handleReset = () => {
        setSourcetype('');
        setTargetDatamodel('');
    };

    const handleDownloadReport = async () => {
        setReportLoading(true);
        setReportError('');
        try {
            const response = await fetch(
                '/en-US/splunkd/__raw/servicesNS/-/cimforge/cimforge_report_pdf?output_mode=json',
                {
                    method:      'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type':      'application/json',
                        'X-Requested-With':  'XMLHttpRequest',
                        'X-Splunk-Form-Key': getSplunkCsrfToken(),
                    },
                    body: JSON.stringify({
                        sourcetype,
                        target_datamodel: targetDatamodel,
                        agent_timeline:  agenticLogs,
                        config_output:   configOutput,
                    }),
                }
            );
            const data = await response.json();
            if (!response.ok) {
                setReportError((data.payload && data.payload.error) || data.error || `HTTP ${response.status}`);
                return;
            }
            const payload = data.payload || data;
            window.open(payload.download_url, '_blank');
        } catch (e) {
            setReportError(String(e));
        } finally {
            setReportLoading(false);
        }
    };

    const handleForge = async () => {
        setError('');
        setAgenticLogs([]);
        setConfigOutput('');
        setDownloadUrl('');
        setDisplayedLogs([]);
        setCurrentLogIndex(0);
        setIsTyping(false);

        setLoading(true);
        try {
            const response = await fetch(
                '/en-US/splunkd/__raw/servicesNS/-/cimforge/cimforge_generate?output_mode=json',
                {
                    method:      'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type':       'application/json',
                        'X-Requested-With':   'XMLHttpRequest',
                        'X-Splunk-Form-Key':  getSplunkCsrfToken(),
                    },
                    body: JSON.stringify({ sourcetype, target_datamodel: targetDatamodel }),
                }
            );
            const data = await response.json();
            if (!response.ok) {
                setError((data.payload && data.payload.error) || data.error || `HTTP ${response.status}`);
                return;
            }
            const payload = data.payload || data;
            setAgenticLogs(payload.agentic_logs || []);
            setConfigOutput(payload.config_output || '');
            setDownloadUrl(payload.download_url || '');
            setDisplayedLogs([]);
            setCurrentLogIndex(0);
            setIsTyping(true);
        } catch (e) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isTyping) return;
        if (currentLogIndex >= agenticLogs.length) { setIsTyping(false); return; }
        const timer = setTimeout(() => {
            setDisplayedLogs((prev) => [...prev, agenticLogs[currentLogIndex]]);
            setCurrentLogIndex((prev) => prev + 1);
        }, 600);
        return () => clearTimeout(timer);
    }, [isTyping, currentLogIndex, agenticLogs]);

    const isDone      = !isTyping && displayedLogs.length > 0;
    const buttonLabel = loading ? 'Forging…' : isDone ? 'Done' : 'Forge Configuration';

    return (
        <>
            {/* ── Gradient divider ── */}
            <div style={{
                height:     '4px',
                background: 'linear-gradient(90deg, #65A637, #58A6FF, #FFB800)',
            }} />

            {/* ── Main container ── */}
            <div style={{
                background:  '#0D1117',
                borderTop:   '3px solid #65A637',
                padding:     '32px',
                fontFamily:  'sans-serif',
            }}>
                {/* Placeholder colour for styled inputs */}
                <style>{`
                    .cas-input::placeholder { color: #8B949E; opacity: 1; }
                `}</style>

                <SponsorBadgeBar />

                {/* ── Status banner — visible once a forge run starts ── */}
                {agenticLogs.length > 0 && (
                    <div style={{
                        display:      'flex',
                        alignItems:   'center',
                        gap:          '10px',
                        background:   'rgba(101,166,55,0.08)',
                        border:       '1px solid rgba(101,166,55,0.25)',
                        borderLeft:   '3px solid #65A637',
                        borderRadius: '4px',
                        padding:      '8px 14px',
                        marginBottom: '20px',
                        fontSize:     '12px',
                        color:        '#E6EDF3',
                    }}>
                        <span style={{ color: '#65A637', fontSize: '16px' }}>⚡</span>
                        {isDone
                            ? 'Autonomous Processing Complete — TA Package Ready'
                            : 'New Firewall Telemetry Detected → Autonomous Processing Started'}
                    </div>
                )}

                {/* ── Header row ── */}
                <div style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'center',
                    marginBottom:   '28px',
                }}>
                    <span style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 'bold' }}>
                        CIMforge Agentic Operations Console
                    </span>
                    <span style={{
                        color:    isTyping ? '#FFB800' : '#65A637',
                        fontSize: '13px',
                    }}>
                        ● {isTyping ? 'Agents Running...' : 'Agentic Ops Ready'}
                    </span>
                </div>

                {/* ── Two-column layout ── */}
                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

                    {/* Left column — 55% */}
                    <div style={{ width: '55%' }}>

                        {/* Form */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ color: '#8B949E', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Sourcetype
                                <input
                                    className="cas-input"
                                    type="text"
                                    placeholder="e.g., acme_firewall"
                                    value={sourcetype}
                                    onChange={(e) => setSourcetype(e.target.value)}
                                    style={INPUT_STYLE}
                                />
                            </label>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ color: '#8B949E', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Target Data Model
                                <input
                                    className="cas-input"
                                    type="text"
                                    placeholder="e.g., Authentication"
                                    value={targetDatamodel}
                                    onChange={(e) => setTargetDatamodel(e.target.value)}
                                    style={INPUT_STYLE}
                                />
                            </label>
                        </div>


                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <button
                                onClick={handleForge}
                                disabled={loading || isTyping}
                                style={{
                                    background:   loading || isTyping ? '#2D4A2D' : '#65A637',
                                    color:        '#FFFFFF',
                                    border:       'none',
                                    borderRadius: '4px',
                                    padding:      '10px 24px',
                                    fontSize:     '14px',
                                    fontWeight:   'bold',
                                    cursor:       loading || isTyping ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {buttonLabel}
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={loading || isTyping}
                                style={{
                                    background:     'none',
                                    border:         'none',
                                    color:          '#8B949E',
                                    fontSize:       '12px',
                                    cursor:         loading || isTyping ? 'not-allowed' : 'pointer',
                                    padding:        '0',
                                    textDecoration: 'underline',
                                }}
                            >
                                Reset
                            </button>
                        </div>

                        {error && (
                            <p style={{ color: '#FF6B6B', fontSize: '13px', marginBottom: '16px' }}>
                                Error: {error}
                            </p>
                        )}

                        <MissionControlPanel
                            agenticLogs={displayedLogs}
                            configOutput={configOutput}
                            downloadUrl={downloadUrl}
                            onDownloadReport={handleDownloadReport}
                            reportLoading={reportLoading}
                            reportError={reportError}
                        />

                        <div style={{ textAlign: 'center', marginTop: '24px' }}>
                            <DependencyGraph
                                activeLogIndex={currentLogIndex}
                                activeStage={deriveStage(displayedLogs)}
                            />
                        </div>
                    </div>

                    {/* Right column — 45% */}
                    <div style={{ width: '45%' }}>
                        <BusinessImpactCard />

                        {isDone ? (
                            <ExecutiveSummary configOutput={configOutput} />
                        ) : (
                            <div style={{
                                border:       '1px dashed #30363D',
                                borderRadius: '6px',
                                padding:      '32px 24px',
                                textAlign:    'center',
                                color:        '#8B949E',
                                fontSize:     '13px',
                            }}>
                                <div style={{ fontSize: '24px', marginBottom: '10px', opacity: 0.35 }}>⬡</div>
                                Executive Summary will appear here<br />after a forge operation completes.
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
};

export default CIMforgeAgentSection;
