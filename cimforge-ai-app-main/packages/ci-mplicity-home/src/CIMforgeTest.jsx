import React, { useState, useEffect } from 'react';
import MissionControlPanel from './MissionControlPanel';
import DependencyGraph from './DependencyGraph';
import ExecutiveSummary from './ExecutiveSummary';

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

function getSplunkCsrfToken() {
    const match = document.cookie.match(/splunkweb_csrf_token_\d+=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

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

const CIMforgeTest = () => {
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
    const [demoMode,        setDemoMode]        = useState(false);

    const handleReset = () => {
        setSourcetype('');
        setTargetDatamodel('');
    };

    const handleForge = async () => {
        setError('');
        setAgenticLogs([]);
        setConfigOutput('');
        setDownloadUrl('');
        setDisplayedLogs([]);
        setCurrentLogIndex(0);
        setIsTyping(false);

        if (demoMode) {
            setAgenticLogs(DEMO_PAYLOAD.agentic_logs);
            setConfigOutput(DEMO_PAYLOAD.config_output);
            setDownloadUrl(DEMO_PAYLOAD.download_url);
            setIsTyping(true);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                '/servicesNS/-/cimforge/cimforge_generate?output_mode=json',
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-Splunk-Form-Key': getSplunkCsrfToken(),
                    },
                    body: JSON.stringify({
                        sourcetype: sourcetype,
                        target_datamodel: targetDatamodel,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                const msg = (data.payload && data.payload.error) || data.error || `HTTP ${response.status}`;
                setError(msg);
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
        if (currentLogIndex >= agenticLogs.length) {
            setIsTyping(false);
            return;
        }
        const timer = setTimeout(() => {
            setDisplayedLogs((prev) => [...prev, agenticLogs[currentLogIndex]]);
            setCurrentLogIndex((prev) => prev + 1);
        }, 600);
        return () => clearTimeout(timer);
    }, [isTyping, currentLogIndex, agenticLogs]);

    const buttonLabel = loading
        ? 'Forging…'
        : !isTyping && displayedLogs.length > 0
        ? 'Done'
        : 'Forge Configuration';

    return (
        <div style={{ padding: '24px', borderTop: '2px solid #ccc', marginTop: '32px' }}>
            <h2 style={{ marginBottom: '16px' }}>CIMforge Generate — Test</h2>

            <div style={{ marginBottom: '12px' }}>
                <label>
                    Sourcetype
                    <br />
                    <input
                        type="text"
                        placeholder="e.g., acme_firewall"
                        value={sourcetype}
                        onChange={(e) => setSourcetype(e.target.value)}
                        style={{ width: '320px', padding: '6px', marginTop: '4px' }}
                    />
                </label>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label>
                    Target Data Model
                    <br />
                    <input
                        type="text"
                        placeholder="e.g., Network Traffic"
                        value={targetDatamodel}
                        onChange={(e) => setTargetDatamodel(e.target.value)}
                        style={{ width: '320px', padding: '6px', marginTop: '4px' }}
                    />
                </label>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#666', userSelect: 'none', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={demoMode}
                        onChange={(e) => setDemoMode(e.target.checked)}
                        style={{ marginRight: '6px', verticalAlign: 'middle' }}
                    />
                    Demo Mode (bypass backend)
                </label>
            </div>

            <button
                onClick={handleForge}
                disabled={loading || isTyping}
                style={{ padding: '8px 16px' }}
            >
                {buttonLabel}
            </button>
            {' '}
            <button
                onClick={handleReset}
                disabled={loading || isTyping}
                style={{
                    background:  'none',
                    border:      'none',
                    color:       '#888',
                    fontSize:    '12px',
                    cursor:      loading || isTyping ? 'not-allowed' : 'pointer',
                    padding:     '0',
                    textDecoration: 'underline',
                }}
            >
                Reset
            </button>

            {error && (
                <p style={{ color: 'red', marginTop: '12px' }}>
                    Error: {error}
                </p>
            )}

            <div style={{ marginTop: '24px' }}>
                <MissionControlPanel
                    agenticLogs={displayedLogs}
                    configOutput={configOutput}
                    downloadUrl={downloadUrl}
                />
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <DependencyGraph
                    activeLogIndex={currentLogIndex}
                    activeStage={deriveStage(displayedLogs)}
                />
            </div>

            {!isTyping && displayedLogs.length > 0 && (
                <ExecutiveSummary configOutput={configOutput} />
            )}
        </div>
    );
};

export default CIMforgeTest;
