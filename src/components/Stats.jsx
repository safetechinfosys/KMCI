import React from 'react';
import { Users, UserCheck, Euro, UserPlus } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="glass-panel card-stat animate-fade">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <label>{title}</label>
            <div style={{
                padding: '0.5rem',
                borderRadius: '10px',
                background: `rgba(${color}, 0.1)`,
                color: `rgb(${color})`
            }}>
                <Icon size={20} />
            </div>
        </div>
        <div className="stat-value">{value}</div>
        {subtext && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtext}</div>}
    </div>
);

const Stats = ({ groups, attendees }) => {
    const totalRegistered = attendees.length;
    const adults = attendees.filter(a => a.type === 'adult').length;
    const kids = attendees.filter(a => a.type === 'child').length;
    const arrived = attendees.filter(a => a.arrived).length;
    const collectedRevenue = groups.filter(g => g.paid).reduce((sum, g) => sum + g.totalFee, 0);
    const expectedRevenue = groups.reduce((sum, g) => sum + g.totalFee, 0);

    return (
        <div className="grid-stats">
            <StatCard
                title="Total Registered"
                value={totalRegistered}
                subtext={`${adults} Adults, ${kids} Children`}
                icon={Users}
                color="99, 102, 241"
            />
            <StatCard
                title="Total Arrived"
                value={arrived}
                subtext={`${Math.round((arrived / totalRegistered || 0) * 100)}% of total`}
                icon={UserCheck}
                color="34, 197, 94"
            />
            <StatCard
                title="Collected Revenue"
                value={`€${collectedRevenue}`}
                subtext={`Expected: €${expectedRevenue}`}
                icon={Euro}
                color="245, 158, 11"
            />
            <StatCard
                title="Total Groups"
                value={groups.length}
                subtext="Registered families/groups"
                icon={UserPlus}
                color="236, 72, 153"
            />
        </div>
    );
};

export default Stats;
