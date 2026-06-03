import React from 'react';

const AGENTS = [
    {
        name: 'MCP Harvester',
        icon: '[MCP]',
        description: 'Pulls raw events from Splunk',
        test: (log) => log.includes('[MCP]'),
    },
    {
        name: 'SAIA Mapper',
        icon: '[SAIA]',
        description: 'Generates CIM mapping configs',
        test: (log) => log.includes('[SAIA]'),
    },
    {
        name: 'Security Validator',
        icon: '[SEC]',
        description: 'Validates regex for ReDoS',
        test: (log) => log.includes('[SEC-MODEL]') || log.includes('[SEC]'),
    },
    {
        name: 'TA Packager',
        icon: '[SDK]',
        description: 'Packages installable Splunk TA',
        test: (log) => log.includes('[SDK]'),
    },
];

function getCardState(logs, agentIdx) {
    const agent = AGENTS[agentIdx];
    const foundAt = logs.findIndex(agent.test);
    if (foundAt === -1) return 'Idle';

    // Complete when: own-or-later log has DONE, or the next agent's log has appeared
    const fromHere = logs.slice(foundAt);
    const hasDone = fromHere.some((log) => log.includes('DONE'));
    const nextAgent = AGENTS[agentIdx + 1];
    const nextAppeared = nextAgent
        ? logs.slice(foundAt + 1).some(nextAgent.test)
        : false;

    return hasDone || nextAppeared ? 'Complete' : 'Active';
}

const STATUS_COLORS = { Idle: '#8B949E', Active: '#FFB800', Complete: '#65A637' };
const BORDER_COLORS  = { Idle: '#30363D', Active: '#FFB800', Complete: '#65A637' };

const MissionControlPanel = ({
    agenticLogs = [],
    configOutput = '',
    downloadUrl = '',
    onDownloadReport,
    reportLoading = false,
    reportError = '',
}) => {
    return (
        <div style={{ background: '#0D1117', color: '#E6EDF3', padding: '24px', fontFamily: 'sans-serif' }}>
            <style>{`
                @keyframes mcp-agent-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(255,184,0,0.5); }
                    50%       { box-shadow: 0 0 12px 4px rgba(255,184,0,0.25); }
                }
            `}</style>

            {/* ── TOP SECTION — Agent Cards ── */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{
                    fontSize: '11px',
                    color: '#8B949E',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '12px',
                }}>
                    Active Agents
                </div>
                <div>
                    {AGENTS.map((agent, idx) => {
                        const status = getCardState(agenticLogs, idx);
                        return (
                        <div
                            key={agent.name}
                            style={{
                                border: `1px solid ${BORDER_COLORS[status]}`,
                                background: '#161B22',
                                color: '#E6EDF3',
                                padding: '12px',
                                width: '22%',
                                display: 'inline-block',
                                marginRight: '2%',
                                verticalAlign: 'top',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.3s, box-shadow 0.3s',
                                ...(status === 'Active' ? { animation: 'mcp-agent-pulse 1.5s ease-in-out infinite' } : {}),
                            }}
                        >
                            <div style={{ fontSize: '20px', marginBottom: '8px', fontFamily: 'monospace', color: '#58A6FF' }}>
                                {agent.icon}
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: STATUS_COLORS[status], fontSize: '10px' }}>●</span>
                                {agent.name}
                            </div>
                            <div style={{ fontSize: '11px', color: STATUS_COLORS[status], marginBottom: '8px' }}>
                                {status}
                            </div>
                            <div style={{ fontSize: '11px', color: '#8B949E', lineHeight: '1.4' }}>
                                {agent.description}
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>

            {/* ── CENTER SECTION — Agent Timeline ── */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{
                    fontSize: '11px',
                    color: '#8B949E',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '12px',
                }}>
                    Agent Timeline
                </div>
                <div style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    background: '#0D1117',
                    border: '1px solid #30363D',
                    padding: '12px',
                }}>
                    {agenticLogs.length === 0 ? (
                        <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#8B949E' }}>
                            Awaiting agent activity…
                        </div>
                    ) : (
                        agenticLogs.map((log, i) => (
                            <div
                                key={i}
                                style={{
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    color: '#39FF14',
                                    marginBottom: '4px',
                                }}
                            >
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ── BOTTOM SECTION — Configuration Preview ── */}
            <div>
                <div style={{
                    fontSize: '11px',
                    color: '#8B949E',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '12px',
                }}>
                    Generated Configuration Preview
                </div>
                <div style={{
                    background: '#161B22',
                    border: '1px solid #30363D',
                    padding: '12px',
                }}>
                    <pre style={{
                        margin: 0,
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: '#E6EDF3',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}>
                        {configOutput || '# No configuration generated yet.'}
                    </pre>
                    {downloadUrl && (
                        <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => window.open(downloadUrl, '_blank')}
                                style={{
                                    padding:    '8px 16px',
                                    background: '#238636',
                                    color:      '#FFFFFF',
                                    border:     'none',
                                    cursor:     'pointer',
                                    fontSize:   '13px',
                                    borderRadius: '4px',
                                }}
                            >
                                Download TA Package
                            </button>
                            {onDownloadReport && (
                                <button
                                    onClick={onDownloadReport}
                                    disabled={reportLoading}
                                    style={{
                                        padding:    '8px 16px',
                                        background: reportLoading ? '#2D4A2D' : '#65A637',
                                        color:      '#FFFFFF',
                                        border:     'none',
                                        cursor:     reportLoading ? 'not-allowed' : 'pointer',
                                        fontSize:   '13px',
                                        borderRadius: '4px',
                                    }}
                                >
                                    {reportLoading ? 'Generating PDF…' : 'Download Executive Report PDF'}
                                </button>
                            )}
                            {reportError && (
                                <p style={{ color: '#FF6B6B', fontSize: '12px', margin: '4px 0 0 0' }}>
                                    Report error: {reportError}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default MissionControlPanel;
