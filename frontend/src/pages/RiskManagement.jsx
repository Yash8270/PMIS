import { useState, useContext } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import PMISContext from '../context/PMISContext';
import { MdAdd } from 'react-icons/md';

const categoryColors = { Financial: '#f59e0b', Technical: '#10b981', 'Schedule Delay': '#14b8a6', 'Safety & Compliance': '#f43f5e', Environmental: '#6366f1', 'Third-party': '#8b5cf6' };
const getRiskLevel = (score) => score >= 15 ? { label: 'High', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' } : score >= 8 ? { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' } : { label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.12)' };

const EmptyState = ({ icon, title, sub, action, onAction }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px', gap: 14 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', border: '2px dashed rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{icon}</div>
        <p style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)' }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 360 }}>{sub}</p>
        {action && <button className="btn btn-primary" onClick={onAction}><MdAdd /> {action}</button>}
    </div>
);

const MATRIX_SIZE = 5;
const MATRIX_LABELS = ['1 - Very Low', '2 - Low', '3 - Moderate', '4 - High', '5 - Very High'];

export default function RiskManagement() {
    const { risks, riskTrend, activeProject, createRisk, updateRisk, deleteRisk } = useContext(PMISContext);
    const [filter, setFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', category: 'Financial', probability: 3, impact: 3, status: 'open', trend: 'stable', mitigation: '' });

    const filtered = risks.filter(r => {
        if (filter === 'all') return true;
        if (filter === 'open') return r.status === 'open';
        if (filter === 'high') return Number(r.risk_score) >= 15;
        if (filter === 'closed') return r.status === 'closed';
        return true;
    });

    const highCount = risks.filter(r => Number(r.risk_score) >= 15).length;
    const medCount = risks.filter(r => Number(r.risk_score) >= 8 && Number(r.risk_score) < 15).length;
    const lowCount = risks.filter(r => Number(r.risk_score) < 8).length;
    const openCount = risks.filter(r => r.status === 'open').length;

    const piData = [
        { name: 'High', value: highCount, color: '#f43f5e' },
        { name: 'Medium', value: medCount, color: '#f59e0b' },
        { name: 'Low', value: lowCount, color: '#10b981' },
    ].filter(d => d.value > 0);

    // Risk matrix positions: x = probability(1-5), y = impact(1-5)
    const matrixRisks = risks.filter(r => r.status !== 'closed');

    const handleCreate = async () => {
        if (!activeProject || !form.title) return;
        await createRisk({
            project_id: activeProject.project_id,
            ...form,
            probability: Number(form.probability),
            impact: Number(form.impact),
        });
        setShowForm(false);
        setForm({ title: '', category: 'Financial', probability: 3, impact: 3, status: 'open', trend: 'stable', mitigation: '' });
    };

    return (
        <div className="animate-fadeInUp">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Risk Management</h1>
                    <p className="page-subtitle">Risk register, probability-impact matrix & trend tracking</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}><MdAdd /> Log Risk</button>
            </div>

            {/* KPI Cards */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Total Risks', value: risks.length || '—', icon: '🔍', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                    { label: 'High Risks', value: highCount || '—', icon: '🔴', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
                    { label: 'Medium Risks', value: medCount || '—', icon: '🟡', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                    { label: 'Open Risks', value: openCount || '—', icon: '⚠️', color: openCount > 0 ? '#f43f5e' : '#10b981', bg: openCount > 0 ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)' },
                ].map((c, i) => (
                    <div key={i} className="glass-card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 50, height: 50, borderRadius: 14, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{c.icon}</div>
                        <div>
                            <p style={{ fontSize: 24, fontWeight: 800, color: c.color, fontFamily: 'Poppins,sans-serif' }}>{c.value}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Risk Matrix */}
                <div className="glass-card section-card">
                    <div className="section-card-title"><span className="title-icon">🎯</span>Probability × Impact Matrix</div>
                    {risks.length === 0 ? (
                        <EmptyState icon="🎯" title="No Risks to Plot" sub="Log risks and the matrix will plot them by probability and impact score." />
                    ) : (
                        <div className="table-responsive" style={{ paddingBottom: 8 }}>
                        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: `24px repeat(${MATRIX_SIZE}, 1fr)`, gridTemplateRows: `repeat(${MATRIX_SIZE}, 1fr) 24px`, gap: 3, minWidth: 400, height: 260 }}>
                            {/* Y axis label */}
                            {Array.from({ length: MATRIX_SIZE }, (_, r) => MATRIX_SIZE - r).map(row => (
                                <div key={`y-${row}`} style={{ gridRow: MATRIX_SIZE - row + 1, gridColumn: 1, fontSize: 9, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{row}</div>
                            ))}
                            {/* Cells */}
                            {Array.from({ length: MATRIX_SIZE }, (_, ri) => MATRIX_SIZE - ri).map(rowImpact =>
                                Array.from({ length: MATRIX_SIZE }, (_, ci) => ci + 1).map(colProb => {
                                    const score = rowImpact * colProb;
                                    const bg = score >= 15 ? 'rgba(244,63,94,0.25)' : score >= 8 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.15)';
                                    const matching = matrixRisks.filter(r => Number(r.probability) === colProb && Number(r.impact) === rowImpact);
                                    return (
                                        <div key={`${rowImpact}-${colProb}`} style={{ gridRow: MATRIX_SIZE - rowImpact + 1, gridColumn: colProb + 1, background: bg, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 40 }}>
                                            {matching.length > 0 && (
                                                <div title={matching.map(r => r.title).join(', ')} style={{ width: 22, height: 22, borderRadius: '50%', background: score >= 15 ? '#f43f5e' : score >= 8 ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>
                                                    {matching.length}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            {/* X axis labels */}
                            {Array.from({ length: MATRIX_SIZE }, (_, c) => c + 1).map(col => (
                                <div key={`x-${col}`} style={{ gridRow: MATRIX_SIZE + 1, gridColumn: col + 1, fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>{col}</div>
                            ))}
                        </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'center' }}>
                        {[['High (≥15)', '#f43f5e'], ['Medium (8-14)', '#f59e0b'], ['Low (<8)', '#10b981']].map(([l, c]) => (
                            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: c, opacity: 0.7 }} />
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Risk Pie + Trend */}
                <div className="glass-card section-card">
                    <div className="section-card-title"><span className="title-icon">📈</span>Risk Distribution & Trend</div>
                    {risks.length === 0 ? (
                        <EmptyState icon="📈" title="No Risk Data" sub="Log risks to see distribution and trend charts." />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                <ResponsiveContainer width="45%" height={160}>
                                    <PieChart>
                                        <Pie data={piData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                                            {piData.map((entry, idx) => <Cell key={idx} fill={entry.color} stroke="transparent" />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#0a1a10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ flex: 1 }}>
                                    {piData.map((r, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
                                            <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{r.name}</span>
                                            <span style={{ fontWeight: 800, color: r.color, fontSize: 16, fontFamily: 'Poppins,sans-serif' }}>{r.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {riskTrend.length > 0 && (
                                <ResponsiveContainer width="100%" height={100}>
                                    <LineChart data={riskTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="month_label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ background: '#0a1a10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 11 }} />
                                        <Line type="monotone" dataKey="high_count" stroke="#f43f5e" strokeWidth={2} dot={false} name="High" />
                                        <Line type="monotone" dataKey="medium_count" stroke="#f59e0b" strokeWidth={2} dot={false} name="Medium" />
                                        <Line type="monotone" dataKey="low_count" stroke="#10b981" strokeWidth={2} dot={false} name="Low" />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Risk Register Table */}
            <div className="glass-card section-card">
                <div className="flex-between" style={{ marginBottom: 16 }}>
                    <div className="section-card-title" style={{ margin: 0 }}><span className="title-icon">📋</span>Risk Register</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['all', 'open', 'high', 'closed'].map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} style={{ textTransform: 'capitalize' }}>{f}</button>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <EmptyState icon="📋" title={risks.length === 0 ? "No Risks Logged" : "No Matching Risks"} sub={risks.length === 0 ? "Click \"Log Risk\" to identify and track project risks. Use the matrix to visualize their severity." : "Try changing the filter above."} action={risks.length === 0 ? "Log First Risk" : null} onAction={() => setShowForm(true)} />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <div className="table-responsive">
                            <table className="pmis-table">
                            <thead>
                                <tr><th>ID</th><th>Title</th><th>Category</th><th>Probability</th><th>Impact</th><th>Score</th><th>Level</th><th>Status</th><th>Trend</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => {
                                    const score = Number(r.risk_score) || (Number(r.probability) * Number(r.impact));
                                    const level = getRiskLevel(score);
                                    return (
                                        <tr key={r.risk_id}>
                                            <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.risk_code || `R${r.risk_id}`}</td>
                                            <td style={{ fontWeight: 600, maxWidth: 180 }}>
                                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                                                {r.mitigation && <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>↳ {r.mitigation}</div>}
                                            </td>
                                            <td>
                                                <span style={{ fontSize: 11, fontWeight: 600, color: categoryColors[r.category] || '#10b981', background: `${categoryColors[r.category] || '#10b981'}18`, padding: '2px 7px', borderRadius: 5 }}>{r.category}</span>
                                            </td>
                                            <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>{r.probability}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>{r.impact}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 800, color: level.color, fontFamily: 'Poppins,sans-serif', fontSize: 15 }}>{score}</td>
                                            <td><span style={{ fontSize: 11, fontWeight: 700, color: level.color, background: level.bg, padding: '3px 8px', borderRadius: 6 }}>{level.label}</span></td>
                                            <td><span className={`badge badge-${r.status === 'open' ? 'danger' : r.status === 'mitigated' ? 'warning' : 'success'}`} style={{ fontSize: 10 }}>{r.status}</span></td>
                                            <td>
                                                <span style={{ fontSize: 12, color: r.trend === 'increasing' ? '#f43f5e' : r.trend === 'decreasing' ? '#10b981' : '#94a3b8' }}>
                                                    {r.trend === 'increasing' ? '↑' : r.trend === 'decreasing' ? '↓' : '→'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {r.status === 'open' && (
                                                        <button className="btn btn-sm btn-secondary" onClick={() => updateRisk(r.risk_id, { status: 'closed' })} style={{ fontSize: 10 }}>Close</button>
                                                    )}
                                                    <button className="btn btn-sm btn-secondary" onClick={() => deleteRisk(r.risk_id)} style={{ color: '#f43f5e', fontSize: 10 }}>Del</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Log Risk Modal */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ padding: 32, width: '100%', maxWidth: 500, border: '1px solid rgba(16,185,129,0.3)' }}>
                        <div className="flex-between" style={{ marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Log New Risk</h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input className="pmis-input" placeholder="Risk title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                            <select className="pmis-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)' }}>
                                {['Financial', 'Technical', 'Schedule Delay', 'Safety & Compliance', 'Environmental', 'Third-party'].map(c => <option key={c}>{c}</option>)}
                            </select>
                            <div className="form-grid-2">
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Probability (1–5): <strong style={{ color: '#10b981' }}>{form.probability}</strong></label>
                                    <input type="range" min="1" max="5" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} style={{ width: '100%', accentColor: '#10b981' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Impact (1–5): <strong style={{ color: '#f43f5e' }}>{form.impact}</strong></label>
                                    <input type="range" min="1" max="5" value={form.impact} onChange={e => setForm({ ...form, impact: e.target.value })} style={{ width: '100%', accentColor: '#f43f5e' }} />
                                </div>
                            </div>
                            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Risk Score: </span>
                                <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Poppins,sans-serif', color: getRiskLevel(form.probability * form.impact).color }}>{form.probability * form.impact}</span>
                                <span style={{ marginLeft: 8, fontSize: 12, color: getRiskLevel(form.probability * form.impact).color }}>({getRiskLevel(form.probability * form.impact).label})</span>
                            </div>
                            <div className="form-grid-2">
                                <select className="pmis-input" value={form.trend} onChange={e => setForm({ ...form, trend: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)' }}>
                                    <option value="stable">Stable →</option>
                                    <option value="increasing">Increasing ↑</option>
                                    <option value="decreasing">Decreasing ↓</option>
                                </select>
                                <select className="pmis-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)' }}>
                                    <option value="open">Open</option>
                                    <option value="mitigated">Mitigated</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <textarea className="pmis-input" placeholder="Mitigation strategy..." rows={3} value={form.mitigation} onChange={e => setForm({ ...form, mitigation: e.target.value })} style={{ resize: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreate}>Log Risk</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
