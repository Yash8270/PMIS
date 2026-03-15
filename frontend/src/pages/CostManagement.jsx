import { useState, useContext } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import PMISContext from '../context/PMISContext';
import { MdAdd } from 'react-icons/md';

const fmt = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}k`;

const EmptyState = ({ icon, title, sub, action, onAction }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px', gap: 14 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', border: '2px dashed rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{icon}</div>
        <p style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)' }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 360 }}>{sub}</p>
        {action && <button className="btn btn-primary" onClick={onAction} style={{ marginTop: 4 }}><MdAdd /> {action}</button>}
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#0a1a10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px' }}>
            <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{label}</p>
            {payload.map((p, i) => <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>{p.name}: {fmt(p.value * 1000)}</p>)}
        </div>
    );
};

export default function CostManagement() {
    const { budgetCategories, monthlyBudgets, expenses, activeProject, createExpense, updateExpenseStatus } = useContext(PMISContext);
    const [catFilter, setCatFilter] = useState('All');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ description: '', amount: '', expense_date: '', category_id: '', status: 'pending' });

    const totalBudget = budgetCategories.reduce((s, c) => s + Number(c.total_budget || 0), 0);
    const totalActual = budgetCategories.reduce((s, c) => s + Number(c.actual_spent || 0), 0);
    const totalVariance = totalBudget - totalActual;
    const cpi = totalBudget > 0 ? (totalBudget / (totalActual || 1)).toFixed(2) : '—';

    const categories = ['All', ...budgetCategories.map(c => c.category_name)];
    const filteredExpenses = catFilter === 'All' ? expenses : expenses.filter(e => e.category_name === catFilter);

    const handleCreateExpense = async () => {
        if (!activeProject || !form.description || !form.amount || !form.expense_date) return;
        await createExpense({
            project_id: activeProject.project_id,
            category_id: form.category_id || null,
            description: form.description,
            amount: parseFloat(form.amount),
            expense_date: form.expense_date,
            status: form.status,
        });
        setShowForm(false);
        setForm({ description: '', amount: '', expense_date: '', category_id: '', status: 'pending' });
    };

    return (
        <div className="animate-fadeInUp">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Cost Management</h1>
                    <p className="page-subtitle">Track budgets, expenses & financial performance</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Log Expense</button>
            </div>

            {/* KPI Cards */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Total Budget', value: totalBudget > 0 ? fmt(totalBudget) : '—', sub: 'Approved', color: '#10b981', grad: 'var(--gradient-primary)' },
                    { label: 'Actual Spent', value: totalActual > 0 ? fmt(totalActual) : '—', sub: totalBudget > 0 ? `${Math.round((totalActual / totalBudget) * 100)}% utilized` : 'No data', color: '#14b8a6', grad: 'var(--gradient-cyan)' },
                    { label: 'Variance', value: totalBudget > 0 ? fmt(Math.abs(totalVariance)) : '—', sub: totalBudget > 0 ? (totalVariance >= 0 ? 'Under budget ✓' : 'Over budget ⚠') : 'No budget set', color: totalVariance >= 0 ? '#10b981' : '#f43f5e', grad: totalVariance >= 0 ? 'var(--gradient-emerald)' : 'var(--gradient-rose)' },
                    { label: 'Cost Perf. Index', value: cpi, sub: cpi !== '—' ? (parseFloat(cpi) >= 1 ? 'Good — on budget' : 'Attention needed') : 'No data yet', color: cpi !== '—' && parseFloat(cpi) >= 1 ? '#10b981' : '#f59e0b', grad: 'var(--gradient-amber)' },
                ].map((k, i) => (
                    <div key={i} className="glass-card" style={{ padding: '22px 24px' }}>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</p>
                        <p style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Poppins,sans-serif', background: k.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 4 }}>{k.value}</p>
                        <p style={{ fontSize: 12, color: k.color }}>{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="glass-card section-card">
                    <div className="section-card-title"><span className="title-icon">📈</span>Monthly Budget vs Actual (₹k)</div>
                    {monthlyBudgets.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={monthlyBudgets.map(m => ({ month: m.month_label, budget: Math.round((m.budget_amount || 0) / 1000), actual: Math.round((m.actual_amount || 0) / 1000) }))} barSize={16} barCategoryGap="40%">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                                <Bar dataKey="budget" name="Budget" fill="rgba(16,185,129,0.4)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="actual" name="Actual" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState icon="📈" title="No Monthly Budget Data" sub="Add monthly budget entries to visualize budget vs actual trends." />
                    )}
                </div>

                <div className="glass-card section-card">
                    <div className="section-card-title"><span className="title-icon">💸</span>Cost by Category — Variance (₹)</div>
                    {budgetCategories.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={budgetCategories.map(c => ({ category: c.category_name, budget: Math.round(c.total_budget / 1000), actual: Math.round((c.actual_spent || 0) / 1000), variance: c.variance }))} layout="vertical" barSize={12} margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                                <Tooltip contentStyle={{ background: '#0a1a10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                                <Bar dataKey="budget" name="Budget" fill="rgba(16,185,129,0.4)" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="actual" name="Actual" radius={[0, 4, 4, 0]}>
                                    {budgetCategories.map((entry, idx) => (
                                        <Cell key={idx} fill={Number(entry.variance) >= 0 ? '#10b981' : '#f43f5e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState icon="💸" title="No Budget Categories" sub="Add budget categories in the backend to track cost by discipline." />
                    )}
                </div>
            </div>

            {/* Expense Log */}
            <div className="glass-card section-card">
                <div className="flex-between" style={{ marginBottom: 16 }}>
                    <div className="section-card-title" style={{ margin: 0 }}><span className="title-icon">🧾</span>Expense Log</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {categories.map(c => (
                            <button key={c} onClick={() => setCatFilter(c)} className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-secondary'}`}>{c}</button>
                        ))}
                    </div>
                </div>
                {filteredExpenses.length === 0 ? (
                    <EmptyState icon="🧾" title="No Expenses Logged" sub="Click 'Log Expense' to record a project expense. All approved expenses appear here." action="Log Expense" onAction={() => setShowForm(true)} />
                ) : (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <div className="table-responsive">
                                <table className="pmis-table">
                                <thead>
                                    <tr><th>ID</th><th>Description</th><th>Category</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.map(e => (
                                        <tr key={e.expense_id}>
                                            <td style={{ color: 'var(--text-muted)' }}>{e.expense_code || `E${e.expense_id}`}</td>
                                            <td style={{ fontWeight: 500 }}>{e.description}</td>
                                            <td><span className="badge badge-primary">{e.category_name || '—'}</span></td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{e.expense_date?.split('T')[0]}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'Poppins, sans-serif' }}>₹{Number(e.amount).toLocaleString()}</td>
                                            <td>
                                                <span className={`badge badge-${e.status === 'approved' ? 'success' : e.status === 'pending' ? 'warning' : 'danger'}`}>{e.status}</span>
                                            </td>
                                            <td>
                                                {e.status === 'pending' && (
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button className="btn btn-sm btn-primary" onClick={() => updateExpenseStatus(e.expense_id, 'approved')}>✓</button>
                                                        <button className="btn btn-sm btn-secondary" onClick={() => updateExpenseStatus(e.expense_id, 'rejected')} style={{ color: '#f43f5e' }}>✕</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                </table>
                            </div>
                        </div>
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                Total Shown: <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'Poppins' }}>₹{filteredExpenses.reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}</strong>
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Log Expense Modal */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ padding: 32, width: 460, border: '1px solid rgba(16,185,129,0.3)' }}>
                        <div className="flex-between" style={{ marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Log Expense</h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input className="pmis-input" placeholder="Description *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <input className="pmis-input" type="number" placeholder="Amount (₹) *" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                                <input className="pmis-input" type="date" placeholder="Date *" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
                            </div>
                            <select className="pmis-input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)' }}>
                                <option value="">Select category (optional)</option>
                                {budgetCategories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateExpense}>Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
