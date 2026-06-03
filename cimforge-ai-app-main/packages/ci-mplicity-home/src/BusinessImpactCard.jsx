import React from 'react';

const METRICS = [
    { label: 'Onboarding Time Saved',    value: '2.5 hrs', color: '#65A637' },
    { label: 'Manual Tasks Eliminated',  value: '14',      color: '#58A6FF' },
    { label: 'Automation Score',         value: '96%',     color: '#FFB800' },
];

const BusinessImpactCard = () => (
    <div style={{
        background:   '#161B22',
        border:       '1px solid #30363D',
        borderTop:    '3px solid #58A6FF',
        borderRadius: '4px',
        padding:      '16px 20px',
        marginBottom: '16px',
    }}>
        <div style={{
            fontSize:      '11px',
            color:         '#8B949E',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom:  '14px',
        }}>
            Business Impact
        </div>

        {METRICS.map(({ label, value, color }) => (
            <div
                key={label}
                style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'center',
                    marginBottom:   '10px',
                    paddingBottom:  '10px',
                    borderBottom:   '1px solid #21262D',
                }}
            >
                <span style={{ fontSize: '12px', color: '#8B949E' }}>{label}</span>
                <span style={{
                    fontSize:    '18px',
                    fontWeight:  'bold',
                    color,
                    fontFamily:  'monospace',
                }}>
                    {value}
                </span>
            </div>
        ))}
    </div>
);

export default BusinessImpactCard;
