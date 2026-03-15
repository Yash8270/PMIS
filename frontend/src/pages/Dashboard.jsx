import { useContext } from 'react';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    MdCheckCircle, MdPeople, MdAttachMoney, MdCalendarToday,
    MdArrowUpward, MdArrowDownward, MdAdd, MdBarChart
} from 'react-icons/md';
import PMISContext from '../context/PMISContext';

const RISK_COLORS = { high: '#f43f5e', medium: '#f59e0b', low: '#10b981' };

const EmptyState = ({ icon, title, sub }) => (
    <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', gap: 12, opacity: 0.5,
    }}>
        <div style={{ fontSize: 40 }}>{icon}</div>
        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>{sub}</p>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: '#0a1a10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px' }}>
                <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
                        {p.name}: ₹{p.value}k
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const {
        activeProject, projectStats, monthlyBudgets, risks, tasks, resources
    } = useContext(PMISContext);

    const hasProject = !!activeProject;
    const stats = projectStats;

    // Derived KPI cards from real data
    const totalBudget = stats?.budget?.total_budget || 0;
    const actualSpent = stats?.budget?.actual_spent || 0;
    const budgetPct = totalBudget > 0 ? Math.round((actualSpent / totalBudget) * 100) : 0;
    const totalTasks = stats?.tasks?.total_tasks || 0;
    const doneTasks = stats?.tasks?.completed_tasks || 0;
    const teamCount = resources?.filter(r => r.type === 'human').length || 0;

    const statCards = [
        {
            icon: <MdCalendarToday />,
            label: 'Total Tasks',
            value: totalTasks || '—',
            trend: `${doneTasks} completed`,
            up: true,
            gradient: 'linear-gradient(135deg,#10b981,#059669)',
            glow: 'rgba(16,185,129,0.3)',
        },
        {
            icon: <MdAttachMoney />,
            label: 'Budget Used',
            value: totalBudget > 0 ? `${budgetPct}%` : '—',
            trend: totalBudget > 0 ? `₹${(actualSpent / 100000).toFixed(1)}L spent` : 'No budget data',
            up: budgetPct <= 100,
            gradient: 'linear-gradient(135deg,#14b8a6,#0d9488)',
            glow: 'rgba(20,184,166,0.3)',
        },
        {
            icon: <MdPeople />,
            label: 'Team Members',
            value: teamCount || '—',
            trend: `${resources?.length || 0} total resources`,
            up: true,
            gradient: 'linear-gradient(135deg,#10b981,#059669)',
            glow: 'rgba(16,185,129,0.3)',
        },
        {
            icon: <MdCheckCircle />,
            label: 'High Risks',
            value: stats?.risks?.high_risks || '—',
            trend: `${stats?.risks?.total_risks || 0} risks tracked`,
            up: (stats?.risks?.high_risks || 0) === 0,
            gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
            glow: 'rgba(245,158,11,0.3)',
        },
    ];

    // Risk pie data from real risks
    const riskData = risks.length > 0 ? [
        { name: 'High', value: risks.filter(r => r.risk_score >= 15).length, color: '#f43f5e' },
        { name: 'Medium', value: risks.filter(r => r.risk_score >= 8 && r.risk_score < 15).length, color: '#f59e0b' },
        { name: 'Low', value: risks.filter(r => r.risk_score < 8).length, color: '#10b981' },
    ] : [];

    // Task progress per phase
    const phaseProgress = tasks.reduce((acc, t) => {
        const key = t.phase_name || 'Unassigned';
        if (!acc[key]) acc[key] = { name: key, total: 0, done: 0 };
        acc[key].total++;
        if (t.status === 'done') acc[key].done++;
        return acc;
    }, {});
    const progressData = Object.values(phaseProgress).map(p => ({
        name: p.name, progress: p.total > 0 ? Math.round((p.done / p.total) * 100) : 0,
        status: p.done === p.total ? 'done' : p.done > 0 ? 'active' : 'pending',
    }));

    if (!hasProject) {
        return (
            <div className="animate-fadeInUp">
                <div className="page-header flex-between">
                    <div>
                        <h1 className="page-title">Project Dashboard</h1>
                        <p className="page-subtitle">Overview of your active project</p>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>🏗️</div>
                    <h2 style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No Project Selected</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                        Create or select a project to view your dashboard metrics.
                    </p>
                    <button className="btn btn-primary"><MdAdd /> Create First Project</button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeInUp">
            {/* Header */}
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Project Dashboard</h1>
                    <p className="page-subtitle">
                        {activeProject.name} &nbsp;|&nbsp; Status:&nbsp;
                        <span style={{ color: '#10b981', fontWeight: 600, textTransform: 'capitalize' }}>{activeProject.status}</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary btn-sm">Export Report</button>
                    <button className="btn btn-primary btn-sm"><MdAdd /> New Task</button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid-4 stagger-children" style={{ marginBottom: 24 }}>
                {statCards.map((card, i) => (
                    <div key={i} className="glass-card stat-card animate-fadeInUp" style={{ '--delay': `${i * 0.1}s` }}>
                        <div className="stat-icon" style={{ background: card.gradient, boxShadow: `0 4px 15px ${card.glow}` }}>
                            {card.icon}
                        </div>
                        <div className="stat-value" style={{ background: card.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            {card.value}
                        </div>
                        <div className="stat-label">{card.label}</div>
                        <div className={`stat-trend ${card.up ? 'up' : 'down'}`}>
                            {card.up ? <MdArrowUpward size={12} /> : <MdArrowDownward size={12} />}
                            {card.trend}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Budget Chart */}
                <div className="glass-card section-card">
                    <div className="section-card-title">
                        <span className="title-icon">💰</span>
                        Budget vs. Actual Spend (₹k)
                    </div>
                    {monthlyBudgets.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={monthlyBudgets.map(m => ({ month: m.month_label, planned: Math.round((m.budget_amount || 0) / 1000), actual: Math.round((m.actual_amount || 0) / 1000) }))} barSize={18} barCategoryGap="35%">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                                <Bar dataKey="planned" name="Planned" fill="rgba(16,185,129,0.5)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState icon="📊" title="No Budget Data Yet" sub="Add monthly budget entries in Cost Management to see trends." />
                    )}
                </div>

                {/* Risk Donut */}
                <div className="glass-card section-card">
                    <div className="section-card-title">
                        <span className="title-icon">⚠️</span>
                        Risk Distribution
                    </div>
                    {riskData.length > 0 && riskData.some(r => r.value > 0) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                            <ResponsiveContainer width="55%" height={200}>
                                <PieChart>
                                    <Pie data={riskData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                        {riskData.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#0a1a10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ flex: 1 }}>
                                {riskData.map((r, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                                        <span style={{ color: 'var(--text-secondary)', fontSize: 13, flex: 1 }}>{r.name} Risk</span>
                                        <span style={{ color: r.color, fontWeight: 700, fontSize: 16 }}>{r.value}</span>
                                    </div>
                                ))}
                                <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                                    Total: <strong style={{ color: 'var(--text-primary)' }}>{risks.length} risks tracked</strong>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <EmptyState icon="⚠️" title="No Risks Logged Yet" sub="Add risks in Risk Management to see distribution here." />
                    )}
                </div>
            </div>

            {/* Progress + Tasks */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Phase Progress */}
                <div className="glass-card section-card">
                    <div className="section-card-title">
                        <span className="title-icon">📊</span>
                        Work Package Progress
                    </div>
                    {progressData.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {progressData.map((item, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span className={`badge badge-${item.status === 'done' ? 'success' : item.status === 'active' ? 'info' : 'warning'}`}>
                                                {item.status}
                                            </span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.progress}%</span>
                                        </div>
                                    </div>
                                    <div className="progress-bar-wrap">
                                        <div className="progress-bar-fill" style={{
                                            width: `${item.progress}%`,
                                            background: item.status === 'done' ? 'var(--gradient-emerald)' : item.status === 'active' ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.2)'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon="📋" title="No Tasks Yet" sub="Add tasks in Planning & Scheduling to track phase progress." />
                    )}
                </div>

                {/* Recent Tasks as Activity */}
                <div className="glass-card section-card">
                    <div className="section-card-title">
                        <span className="title-icon">🕐</span>
                        Recent Tasks
                    </div>
                    {tasks.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {tasks.slice(0, 6).map((task, i) => (
                                <div key={task.task_id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                    <div className="avatar" style={{ background: task.status === 'done' ? '#10b981' : task.status === 'active' ? '#14b8a6' : '#475569', fontSize: 11, width: 34, height: 34 }}>
                                        {task.avatar_initials || task.assignee_name?.[0] || '?'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</p>
                                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{task.phase_name || 'No Phase'} &nbsp;·&nbsp; Day {task.start_day}</p>
                                    </div>
                                    <span className={`badge badge-${task.status === 'done' ? 'success' : task.status === 'active' ? 'info' : 'warning'}`} style={{ alignSelf: 'center', fontSize: 10 }}>
                                        {task.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon="📝" title="No Tasks Yet" sub="Tasks you create will appear here for quick access." />
                    )}
                </div>
            </div>

            {/* Project Health Banner */}
            <div className="glass-card" style={{ padding: '20px 28px', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.08))', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="flex-between">
                    <div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Project Status</p>
                        <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Poppins, sans-serif', color: '#10b981', textTransform: 'capitalize' }}>
                            🟢 {activeProject.status}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 28 }}>
                        {[
                            { label: 'Tasks Completed', value: `${doneTasks}/${totalTasks}`, ok: true },
                            { label: 'Budget Utilization', value: totalBudget > 0 ? `${budgetPct}%` : 'N/A', ok: budgetPct <= 100 },
                            { label: 'Active Risks', value: stats?.risks?.open_risks || 0, ok: (stats?.risks?.high_risks || 0) === 0 },
                            { label: 'Team Size', value: teamCount || 0, ok: true },
                        ].map((m, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 18, fontWeight: 800, color: m.ok ? '#10b981' : '#f59e0b', fontFamily: 'Poppins, sans-serif' }}>{m.value}</p>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
