import React from 'react';

const BADGES = [
    {
        label:      'MCP Server',
        background: 'rgba(101, 166, 55, 0.15)',
        color:      '#65A637',
        border:     '1px solid rgba(101, 166, 55, 0.3)',
    },
    {
        label:      'AI Assistant',
        background: 'rgba(88, 166, 255, 0.15)',
        color:      '#58A6FF',
        border:     '1px solid rgba(88, 166, 255, 0.3)',
    },
    {
        label:      'Sec Model',
        background: 'rgba(255, 184, 0, 0.15)',
        color:      '#FFB800',
        border:     '1px solid rgba(255, 184, 0, 0.3)',
    },
    {
        label:      'Python SDK',
        background: 'rgba(230, 237, 243, 0.1)',
        color:      '#E6EDF3',
        border:     '1px solid rgba(230, 237, 243, 0.2)',
    },
];

const SponsorBadgeBar = () => (
    <div style={{ marginBottom: '20px' }}>
        {BADGES.map(({ label, background, color, border }) => (
            <span
                key={label}
                style={{
                    display:      'inline-block',
                    borderRadius: '12px',
                    padding:      '4px 12px',
                    fontSize:     '11px',
                    fontFamily:   'monospace',
                    marginRight:  '8px',
                    background,
                    color,
                    border,
                }}
            >
                {label}
            </span>
        ))}
    </div>
);

export default SponsorBadgeBar;
