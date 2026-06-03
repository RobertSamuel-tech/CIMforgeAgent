import React from 'react';

const CARDS = [
    {
        label:   'Risk Score',
        value:   'LOW',
        color:   '#65A637',
        subtext: 'No ReDoS vulnerabilities detected',
    },
    {
        label:   'CIM Coverage',
        value:   '94%',
        color:   '#58A6FF',
        subtext: '18 of 20 CIM fields mapped',
    },
    {
        label:   'Security Scan',
        value:   'PASSED',
        color:   '#65A637',
        subtext: 'Cisco Foundation Sec Model validated',
    },
    {
        label:   'Package Status',
        value:   'READY',
        color:   '#FFB800',
        subtext: 'TA-cimforge-custom.tar.gz generated',
    },
];

const ExecutiveSummary = ({ configOutput }) => {
    return (
        <div style={{ marginTop: '24px' }}>
            {CARDS.map(({ label, value, color, subtext }) => (
                <div
                    key={label}
                    style={{
                        display:         'inline-block',
                        width:           '23%',
                        marginRight:     '1%',
                        background:      '#161B22',
                        border:          '1px solid #30363D',
                        borderTop:       `3px solid ${color}`,
                        padding:         '16px',
                        textAlign:       'center',
                        verticalAlign:   'top',
                        boxSizing:       'border-box',
                    }}
                >
                    <div style={{
                        fontSize:   '11px',
                        color:      '#8B949E',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                    }}>
                        {label}
                    </div>
                    <div style={{
                        fontSize:   '28px',
                        fontWeight: 'bold',
                        color:      color,
                        marginBottom: '8px',
                    }}>
                        {value}
                    </div>
                    <div style={{
                        fontSize: '11px',
                        color:    '#8B949E',
                    }}>
                        {subtext}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ExecutiveSummary;
