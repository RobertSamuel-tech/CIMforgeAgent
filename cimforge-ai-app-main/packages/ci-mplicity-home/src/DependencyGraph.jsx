import React from 'react';

const STAGE_ORDER = [null, 'mcp', 'saia', 'security', 'sdk', 'done'];

function stageGte(stage, minStage) {
    const si = STAGE_ORDER.indexOf(stage);
    const mi = STAGE_ORDER.indexOf(minStage);
    return si !== -1 && mi !== -1 && si >= mi;
}

function stageFromIndex(idx) {
    if (idx >= 5) return 'done';
    if (idx >= 4) return 'sdk';
    if (idx >= 3) return 'security';
    if (idx >= 2) return 'saia';
    if (idx >= 1) return 'mcp';
    return null;
}

// thisStage: the stage at which this node is "currently active" (yellow pulse).
// minStage:  the stage at which this node first lights up.
const NODES = [
    { cx: 50,  cy: 150, label: 'Source Logs',   alwaysColor: '#58A6FF', minStage: null,       thisStage: null },
    { cx: 180, cy: 80,  label: 'MCP Agent',      alwaysColor: null,      minStage: 'mcp',      thisStage: 'mcp' },
    { cx: 320, cy: 80,  label: 'SAIA Agent',     alwaysColor: null,      minStage: 'saia',     thisStage: 'saia' },
    { cx: 460, cy: 80,  label: 'Security Agent', alwaysColor: null,      minStage: 'security', thisStage: 'security' },
    { cx: 550, cy: 150, label: 'TA Package',     alwaysColor: null,      minStage: 'sdk',      thisStage: 'sdk' },
];

const LINES = [
    { x1: 50,  y1: 150, x2: 180, y2: 80,  minStage: 'mcp' },
    { x1: 180, y1: 80,  x2: 320, y2: 80,  minStage: 'saia' },
    { x1: 320, y1: 80,  x2: 460, y2: 80,  minStage: 'security' },
    { x1: 460, y1: 80,  x2: 550, y2: 150, minStage: 'sdk' },
    { x1: 50,  y1: 150, x2: 550, y2: 150, minStage: 'done' },
];

function nodeState(node, activeStage) {
    if (node.alwaysColor) return 'source';
    if (!stageGte(activeStage, node.minStage)) return 'idle';
    if (activeStage === node.thisStage) return 'active';
    return 'complete';
}

const NODE_FILL   = { source: '#58A6FF', idle: '#3A3F47', active: '#FFB800', complete: '#65A637' };
const LABEL_COLOR = { source: '#79B8FF', idle: '#8B949E', active: '#FFD966', complete: '#7EC86A' };

const DependencyGraph = ({ activeLogIndex = 0, activeStage: activeStageProp }) => {
    const activeStage = activeStageProp !== undefined
        ? activeStageProp
        : stageFromIndex(activeLogIndex);

    return (
        <svg
            viewBox="0 0 600 230"
            style={{ width: '100%', maxWidth: '600px', background: '#0D1117', display: 'block', borderRadius: '4px' }}
            aria-label="Agent dependency graph"
        >
            <defs>
                <filter id="dg-glow-a" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="dg-glow-c" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="dg-glow-s" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* ── Lines ── */}
            {LINES.map((line, i) => {
                const active = stageGte(activeStage, line.minStage);
                const motionPath = `M ${line.x1},${line.y1} L ${line.x2},${line.y2}`;
                return (
                    <g key={i}>
                        <line
                            x1={line.x1} y1={line.y1}
                            x2={line.x2} y2={line.y2}
                            stroke={active ? '#65A637' : '#30363D'}
                            strokeWidth={active ? '2.5' : '1.5'}
                        />
                        {/* Traveling dot on active connections */}
                        {active && (
                            <circle r="3.5" fill="#39FF14" opacity="0.85">
                                <animateMotion
                                    path={motionPath}
                                    dur="1.8s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                        )}
                    </g>
                );
            })}

            {/* ── Nodes ── */}
            {NODES.map((node) => {
                const state     = nodeState(node, activeStage);
                const fill      = node.alwaysColor || NODE_FILL[state];
                const isActive  = state === 'active';
                const isComplete = state === 'complete';
                const isSource  = state === 'source';
                const filter    = isActive ? 'url(#dg-glow-a)' : isComplete ? 'url(#dg-glow-c)' : isSource ? 'url(#dg-glow-s)' : 'none';

                return (
                    <g key={node.label}>
                        {/* Expanding pulse ring for the active node */}
                        {isActive && (
                            <circle cx={node.cx} cy={node.cy} r={28} fill="none" stroke="#FFB800" strokeWidth="2.5" opacity="1">
                                <animate attributeName="r"       values="28;46;28" dur="1.5s" calcMode="ease-out" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="1;0;1"    dur="1.5s" repeatCount="indefinite" />
                            </circle>
                        )}

                        {/* Node body */}
                        <circle
                            cx={node.cx} cy={node.cy} r={28}
                            fill={fill}
                            filter={filter}
                        />

                        {/* Node label */}
                        <text
                            x={node.cx} y={node.cy + 44}
                            textAnchor="middle"
                            fontFamily="Arial, sans-serif"
                            fontSize="11"
                            fill={LABEL_COLOR[state]}
                        >
                            {node.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

export default DependencyGraph;
