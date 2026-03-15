import { useState, useContext } from 'react';
import PMISContext from '../context/PMISContext';
import { MdAdd, MdSearch } from 'react-icons/md';

const typeColors = { human: '#10b981', equipment: '#f59e0b', material: '#14b8a6' };
const statusColors = { active: '#10b981', 'on-leave': '#f59e0b', inactive: '#64748b', available: '#10b981', 'in-use': '#f59e0b', maintenance: '#f43f5e' };

const EmptyState = ({ icon, title, sub, action, onAction }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px', gap: 14 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', border: '2px dashed rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{icon}</div>
        <p style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)' }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 360 }}>{sub}</p>
        {action && <button className="btn btn-primary" onClick={onAction}><MdAdd /> {action}</button>}
    </div>
);

export default function ResourceManagement() {
    const { resources, activeProject, createResource, updateResource, deleteResource } = useContext(PMISContext);
    const [tab, setTab] = useState('human');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'human', role_title: '', utilization_pct: 0, status: 'active', skills: '', current_allocation: '' });

    const filtered = resources
        .filter(r => r.type === tab)
        .filter(r => r.name?.toLowerCase().includes(search.toLowerCase()) || r.role_title?.toLowerCase().includes(search.toLowerCase()));

    const human = resources.filter(r => r.type === 'human');
    const equipment = resources.filter(r => r.type === 'equipment');
    const material = resources.filter(r => r.type === 'material');
    const avgUtil = human.length > 0 ? Math.round(human.reduce((s, r) => s + Number(r.utilization_pct || 0), 0) / human.length) : 0;
    const overloaded = human.filter(r => Number(r.utilization_pct) > 90).length;

    const handleCreate = async () => {
        if (!activeProject || !form.name) return;
        const skillsArr = form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
        await createResource({ project_id: activeProject.project_id, ...form, skills: skillsArr, utilization_pct: Number(form.utilization_pct) });
        setShowForm(false);
        setForm({ name: '', type: 'human', role_title: '', utilization_pct: 0, status: 'active', skills: '', current_allocation: '' });
    };

    return (
        <div className="animate-fadeInUp">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Resource Management</h1>
                    <p className="page-subtitle">Team members, equipment & material tracking</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}><MdAdd /> Add Resource</button>
            </div>

            {/* KPI Cards */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Team Members', value: human.length || '—', icon: '👥', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                    { label: 'Avg Utilization', value: human.length > 0 ? `${avgUtil}%` : '—', icon: '📊', color: avgUtil > 90 ? '#f43f5e' : '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
                    { label: 'Overloaded (>90%)', value: overloaded || '—', icon: '⚠️', color: overloaded > 0 ? '#f43f5e' : '#10b981', bg: overloaded > 0 ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)' },
                    { label: 'Equipment / Material', value: equipment.length + material.length || '—', icon: '🏗️', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                ].map((c, i) => (
                    <div key={i} className="glass-card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 50, height: 50, borderRadius: 14, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{c.icon}</div>
                        <div>
                            <p style={{ fontSize: 22, fontWeight: 800, color: c.color, fontFamily: 'Poppins,sans-serif' }}>{c.value}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Utilization Bar (human only) */}
            {human.length > 0 && (
                <div className="glass-card section-card" style={{ marginBottom: 20 }}>
                    <div className="section-card-title"><span className="title-icon">📊</span>Team Utilization</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {human.map(r => {
                            const pct = Number(r.utilization_pct) || 0;
                            const color = pct > 90 ? '#f43f5e' : pct > 70 ? '#f59e0b' : '#10b981';
                            return (
                                <div key={r.resource_id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="avatar" style={{ background: color, width: 32, height: 32, fontSize: 10, flexShrink: 0 }}>
                                        {r.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                    </div>
                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', width: 140, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                                    <div className="progress-bar-wrap" style={{ flex: 1 }}>
                                        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color}88)`, transition: '0.8s ease' }} />
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color, width: 42, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tabs + Table */}
            <div className="glass-card section-card">
                <div className="flex-between" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {['human', 'equipment', 'material'].map(t => (
                            <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`} style={{ textTransform: 'capitalize' }}>
                                {t === 'human' ? '👥' : t === 'equipment' ? '🏗️' : '📦'} {t}
                            </button>
                        ))}
                    </div>
                    <div className="search-bar" style={{ minWidth: 200 }}>
                        <MdSearch size={14} />
                        <input placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <EmptyState
                        icon={tab === 'human' ? '👥' : tab === 'equipment' ? '🏗️' : '📦'}
                        title={`No ${tab.charAt(0).toUpperCase() + tab.slice(1)} Resources`}
                        sub={resources.length === 0 ? `Add ${tab} resources to track allocations and utilization for this project.` : `No ${tab} resources match your search.`}
                        action={resources.length === 0 ? `Add ${tab.charAt(0).toUpperCase() + tab.slice(1)}` : null}
                        onAction={() => { setForm({ ...form, type: tab }); setShowForm(true); }}
                    />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <div className="table-responsive">
                            <table className="pmis-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    {tab === 'human' && <><th>Role</th><th>Skills</th><th>Utilization</th></>}
                                    {tab !== 'human' && <><th>Allocation</th></>}
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => {
                                    const pct = Number(r.utilization_pct) || 0;
                                    const uColor = pct > 90 ? '#f43f5e' : pct > 70 ? '#f59e0b' : '#10b981';
                                    const skills = (() => { try { return Array.isArray(r.skills) ? r.skills : JSON.parse(r.skills || '[]'); } catch { return []; } })();
                                    return (
                                        <tr key={r.resource_id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div className="avatar" style={{ background: typeColors[r.type], width: 30, height: 30, fontSize: 10 }}>
                                                        {r.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</span>
                                                </div>
                                            </td>
                                            {tab === 'human' && (
                                                <>
                                                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{r.role_title || '—'}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                            {skills.slice(0, 3).map((s, i) => <span key={i} className="badge badge-primary" style={{ fontSize: 10 }}>{s}</span>)}
                                                            {skills.length > 3 && <span className="badge badge-primary" style={{ fontSize: 10 }}>+{skills.length - 3}</span>}
                                                            {skills.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <div className="progress-bar-wrap" style={{ width: 80 }}>
                                                                <div className="progress-bar-fill" style={{ width: `${pct}%`, background: uColor }} />
                                                            </div>
                                                            <span style={{ fontSize: 13, fontWeight: 700, color: uColor }}>{pct}%</span>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                            {tab !== 'human' && (
                                                <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{r.current_allocation || '—'}</td>
                                            )}
                                            <td>
                                                <span style={{ fontSize: 11, fontWeight: 600, color: statusColors[r.status] || '#64748b', background: `${statusColors[r.status] || '#64748b'}18`, padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize' }}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-secondary" onClick={() => deleteResource(r.resource_id)} style={{ color: '#f43f5e', fontSize: 11 }}>Remove</button>
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

            {/* Add Resource Modal */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ padding: 32, width: 460, border: '1px solid rgba(16,185,129,0.3)' }}>
                        <div className="flex-between" style={{ marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add Resource</h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input className="pmis-input" placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            <select className="pmis-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)' }}>
                                <option value="human">Human</option>
                                <option value="equipment">Equipment</option>
                                <option value="material">Material</option>
                            </select>
                            <input className="pmis-input" placeholder="Role / Title" value={form.role_title} onChange={e => setForm({ ...form, role_title: e.target.value })} />
                            <input className="pmis-input" placeholder="Skills (comma separated)" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <input className="pmis-input" type="number" min="0" max="100" placeholder="Utilization %" value={form.utilization_pct} onChange={e => setForm({ ...form, utilization_pct: e.target.value })} />
                                <select className="pmis-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)' }}>
                                    <option value="active">Active</option>
                                    <option value="on-leave">On Leave</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="available">Available</option>
                                    <option value="in-use">In Use</option>
                                </select>
                            </div>
                            <input className="pmis-input" placeholder="Current allocation (e.g. Phase 2)" value={form.current_allocation} onChange={e => setForm({ ...form, current_allocation: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreate}>Add Resource</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
