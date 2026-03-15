import { useContext, useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import PMISContext from '../context/PMISContext';

const EmptyState = ({ icon, title, sub }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 12, opacity: 0.6 }}>
        <div style={{ fontSize: 36 }}>{icon}</div>
        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 320 }}>{sub}</p>
    </div>
);

const fmt = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n > 0 ? `₹${(n / 1000).toFixed(0)}k` : '—';

export default function Reporting() {
    const { activeProject, projectStats, tasks, risks, monthlyBudgets, budgetCategories, expenses, resources } = useContext(PMISContext);
    const [reportModal, setReportModal] = useState(false);

    const totalBudget = budgetCategories.reduce((s, c) => s + Number(c.total_budget || 0), 0);
    const actualSpent = budgetCategories.reduce((s, c) => s + Number(c.actual_spent || 0), 0);
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const spi = totalTasks > 0 ? (doneTasks / totalTasks).toFixed(2) : null;
    const cpi = totalBudget > 0 && actualSpent > 0 ? (totalBudget / actualSpent).toFixed(2) : null;
    const highRisks = risks.filter(r => Number(r.risk_score) >= 15).length;

    const kpiCards = [
        { label: 'Schedule Performance Index', value: spi || '—', sub: spi ? (parseFloat(spi) >= 1 ? '✅ Ahead of schedule' : '⚠️ Behind schedule') : 'No task data', color: spi && parseFloat(spi) >= 1 ? '#10b981' : '#f59e0b', grad: 'var(--gradient-emerald)', icon: '📅' },
        { label: 'Cost Performance Index', value: cpi || '—', sub: cpi ? (parseFloat(cpi) >= 1 ? '✅ Under budget' : '⚠️ Over budget') : 'No cost data', color: cpi && parseFloat(cpi) >= 1 ? '#10b981' : '#f43f5e', grad: 'var(--gradient-amber)', icon: '💰' },
        { label: 'Total Budget', value: fmt(totalBudget), sub: `${fmt(actualSpent)} spent`, color: '#10b981', grad: 'var(--gradient-primary)', icon: '📊' },
        { label: 'High Risks', value: highRisks || '—', sub: `${risks.length} total tracked`, color: highRisks > 0 ? '#f43f5e' : '#10b981', grad: highRisks > 0 ? 'var(--gradient-rose)' : 'var(--gradient-emerald)', icon: '⚠️' },
    ];

    // EVM S-curve from monthly budgets
    const scurveData = monthlyBudgets.map(m => ({
        month: m.month_label,
        planned: Math.round((m.budget_amount || 0) / 1000),
        actual: Math.round((m.actual_amount || 0) / 1000),
        forecast: Math.round((m.forecast_amount || 0) / 1000),
    }));

    // Cost variance per month
    const varianceData = monthlyBudgets.map(m => ({
        month: m.month_label,
        variance: Math.round(((m.budget_amount || 0) - (m.actual_amount || 0)) / 1000),
    }));

    // Task completion by phase
    const phaseMap = tasks.reduce((acc, t) => {
        const k = t.phase_name || 'Unassigned';
        if (!acc[k]) acc[k] = { phase: k, total: 0, done: 0 };
        acc[k].total++;
        if (t.status === 'done') acc[k].done++;
        return acc;
    }, {});
    const qualityData = Object.values(phaseMap).map(p => ({ item: p.phase, score: p.total > 0 ? Math.round((p.done / p.total) * 100) : 0, target: 80 }));

    // Performance table from derived data
    const ev = totalBudget > 0 ? (totalBudget * (doneTasks / Math.max(totalTasks, 1))) : 0;
    const cv = ev - actualSpent;
    const eac = actualSpent > 0 && ev > 0 ? (totalBudget / (ev / actualSpent)) : 0;
    const performanceTable = [
        { metric: 'Planned Value (PV)', value: fmt(totalBudget), variance: '—', status: 'ok' },
        { metric: 'Earned Value (EV)', value: fmt(ev), variance: ev && totalBudget ? `${((ev / totalBudget) * 100 - 100).toFixed(1)}%` : '—', status: ev >= totalBudget * 0.9 ? 'ok' : 'warn' },
        { metric: 'Actual Cost (AC)', value: fmt(actualSpent), variance: '—', status: 'ok' },
        { metric: 'Cost Variance (CV)', value: cv >= 0 ? fmt(cv) : `-${fmt(Math.abs(cv))}`, variance: totalBudget > 0 ? `${((cv / totalBudget) * 100).toFixed(1)}%` : '—', status: cv >= 0 ? 'ok' : 'warn' },
        { metric: 'SPI', value: spi || '—', variance: '—', status: spi && parseFloat(spi) >= 1 ? 'ok' : 'warn' },
        { metric: 'CPI', value: cpi || '—', variance: '—', status: cpi && parseFloat(cpi) >= 1 ? 'ok' : 'warn' },
        { metric: 'Budget at Completion (BAC)', value: fmt(totalBudget), variance: '—', status: 'ok' },
        { metric: 'Estimate at Completion (EAC)', value: fmt(eac), variance: fmt(eac) !== '—' ? `${((eac / totalBudget - 1) * 100).toFixed(1)}%` : '—', status: eac <= totalBudget ? 'ok' : 'warn' },
    ];

    const hasData = totalTasks > 0 || totalBudget > 0 || risks.length > 0;

    return (
        <div className="animate-fadeInUp">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Reporting & Decision Support</h1>
                    <p className="page-subtitle">Earned value metrics, variance analysis & performance summaries</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => setReportModal(true)}>📄 Preview Report</button>
                    <button className="btn btn-primary">Export PDF</button>
                </div>
            </div>

            {!hasData && (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
                    <h2 style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Project Data Yet</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        Add tasks, budget categories, expenses, and risks to generate performance reports and EVM metrics.
                    </p>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {kpiCards.map((k, i) => (
                    <div key={i} className="glass-card" style={{ padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: k.grad, opacity: 0.08 }} />
                        <div style={{ fontSize: 24, marginBottom: 10 }}>{k.icon}</div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</p>
                        <p style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Poppins,sans-serif', background: k.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 4 }}>{k.value}</p>
                        <p style={{ fontSize: 12, color: k.color }}>{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="glass-card section-card">
                    <div className="section-card-title"><span className="title-icon">📈</span>Budget S-Curve (₹k)</div>
                    {scurveData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={scurveData}>
                                <defs>
                                    <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="acGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#0a1a10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                                <Area type="monotone" dataKey="planned" name="PV (₹k)" stroke="#10b981" strokeWidth={2} fill="url(#pvGrad)" />
                                <Area type="monotone" dataKey="actual" name="AC (₹k)" stroke="#f59e0b" strokeWidth={2} fill="url(#acGrad)" strokeDasharray="5 3" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState icon="📈" title="No Monthly Data" sub="Add monthly budget entries to generate the S-curve." />
                    )}
                </div>

                <div className="glass-card section-card">
                    <div className="section-card-title"><span className="title-icon">📉</span>Monthly Cost Variance (₹k)</div>
                    {varianceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={varianceData} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#0a1a10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} />
                                <Bar dataKey="variance" name="Variance (₹k)" radius={[4, 4, 0, 0]}>
                                    {varianceData.map((d, i) => (
                                        <rect key={i} fill={d.variance >= 0 ? '#10b981' : '#f43f5e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState icon="📉" title="No Variance Data" sub="Monthly budget entries needed to compute cost variance." />
                    )}
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Phase Completion */}
                <div className="glass-card section-card">
                    <div className="section-card-title"><span className="title-icon">🎯</span>Task Completion by Phase</div>
                    {qualityData.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {qualityData.map((q, i) => (
                                <div key={i}>
                                    <div className="flex-between" style={{ marginBottom: 5 }}>
                                        <span style={{ fontSize: 13, fontWeight: 500 }}>{q.item}</span>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target: {q.target}%</span>
                                            <span style={{ fontWeight: 700, color: q.score >= q.target ? '#10b981' : '#f43f5e', fontSize: 14 }}>{q.score}%</span>
                                        </div>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <div className="progress-bar-wrap">
                                            <div className="progress-bar-fill" style={{ width: `${q.score}%`, background: q.score >= q.target ? 'var(--gradient-emerald)' : 'var(--gradient-rose)' }} />
                                        </div>
                                        <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${q.target}%`, width: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon="🎯" title="No Phase Data" sub="Add tasks with phases to see completion rates by work area." />
                    )}
                </div>

                {/* EVM Table */}
                <div className="glass-card section-card">
                    <div className="section-card-title"><span className="title-icon">📋</span>Earned Value Performance Summary</div>
                    {hasData ? (
                        <div style={{ overflowX: 'auto' }}>
                            <div className="table-responsive">
                                <table className="pmis-table">
                                <thead>
                                    <tr><th>Metric</th><th>Value</th><th>Variance</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {performanceTable.map((row, i) => (
                                        <tr key={i}>
                                            <td style={{ fontSize: 13, fontWeight: 500 }}>{row.metric}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'Poppins' }}>{row.value}</td>
                                            <td style={{ color: row.variance?.startsWith('-') ? '#f43f5e' : row.variance === '—' ? 'var(--text-muted)' : '#10b981', fontWeight: 600, fontSize: 12 }}>{row.variance}</td>
                                            <td>{row.status === 'ok' ? '🟢' : '🟡'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <EmptyState icon="📋" title="No Data to Compute" sub="EVM metrics will appear once tasks, budget, and expenses are added." />
                    )}
                </div>
            </div>

            {/* Report Modal */}
            {reportModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ padding: 36, width: '100%', maxWidth: 620, maxHeight: '80vh', overflowY: 'auto', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <div className="flex-between" style={{ marginBottom: 24 }}>
                            <div>
                                <h2 style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: 700 }}>Monthly Project Report</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{activeProject?.name} — {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                            </div>
                            <button className="btn btn-secondary btn-sm" onClick={() => setReportModal(false)}>✕ Close</button>
                        </div>
                        <div className="form-grid-2" style={{ gap: 16, marginBottom: 20 }}>
                            {[
                                ['Project', activeProject?.name || '—'],
                                ['Status', activeProject?.status || '—'],
                                ['SPI', spi || '—'],
                                ['CPI', cpi || '—'],
                                ['Tasks Done', `${doneTasks} / ${totalTasks}`],
                                ['High Risks', highRisks],
                                ['Budget Used', totalBudget > 0 ? `${Math.round((actualSpent / totalBudget) * 100)}%` : '—'],
                                ['Team Size', resources.filter(r => r.type === 'human').length],
                            ].map(([k, v]) => (
                                <div key={k} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px' }}>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{k}</p>
                                    <p style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{v}</p>
                                </div>
                            ))}
                        </div>
                        <div style={{ height: 1, background: 'var(--border-glass)', margin: '16px 0' }} />
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Executive Summary</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                            {activeProject ? (
                                `The project "${activeProject.name}" is currently ${activeProject.status}. ` +
                                (spi ? `Schedule Performance Index (SPI) is ${spi} (${parseFloat(spi) >= 1 ? 'ahead of' : 'behind'} schedule). ` : '') +
                                (cpi ? `Cost Performance Index (CPI) is ${cpi} (${parseFloat(cpi) >= 1 ? 'under' : 'over'} budget). ` : '') +
                                `${doneTasks} of ${totalTasks} tasks completed. ${risks.length} risks tracked with ${highRisks} classified as high priority.`
                            ) : 'No project selected.'}
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={() => setReportModal(false)}>Export to PDF</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
