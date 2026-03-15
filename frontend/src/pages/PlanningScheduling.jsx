import { useState, useContext } from 'react';
import { MdAdd, MdSearch, MdFilterList } from 'react-icons/md';
import PMISContext from '../context/PMISContext';

const PHASE_COLORS = {
    'Phase 1': '#10b981', 'Phase 2': '#10b981',
    'Phase 3': '#f59e0b', 'Phase 4': '#f43f5e',
};

const EmptyState = ({ icon, title, sub, action, onAction }) => (
    <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '56px 24px', gap: 14,
    }}>
        <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(16,185,129,0.08)', border: '2px dashed rgba(16,185,129,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
        }}>{icon}</div>
        <p style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)' }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 360 }}>{sub}</p>
        {action && (
            <button className="btn btn-primary" onClick={onAction} style={{ marginTop: 4 }}>
                <MdAdd /> {action}
            </button>
        )}
    </div>
);

const TOTAL_DAYS = 120;
const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

export default function PlanningScheduling() {
    const { tasks, phases, activeProject, createTask } = useContext(PMISContext);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', phase_id: '', start_day: '', duration_days: '', status: 'pending', is_critical: false });

    const filtered = tasks.filter(t => {
        const matchFilter = filter === 'all' || t.status === filter || (filter === 'critical' && t.is_critical);
        const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const handleCreate = async () => {
        if (!activeProject || !form.name || !form.start_day || !form.duration_days) return;
        await createTask({
            project_id: activeProject.project_id,
            phase_id: form.phase_id || null,
            name: form.name,
            start_day: parseInt(form.start_day),
            duration_days: parseInt(form.duration_days),
            status: form.status,
            is_critical: form.is_critical ? 1 : 0,
        });
        setShowForm(false);
        setForm({ name: '', phase_id: '', start_day: '', duration_days: '', status: 'pending', is_critical: false });
    };

    return (
        <div className="animate-fadeInUp">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Planning & Scheduling</h1>
                    <p className="page-subtitle">Gantt chart, network diagrams & critical path analysis</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}><MdAdd /> New Task</button>
            </div>

            {/* Summary Cards */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Total Tasks', value: tasks.length, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                    { label: 'Completed', value: tasks.filter(t => t.status === 'done').length, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                    { label: 'In Progress', value: tasks.filter(t => t.status === 'active').length, color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
                    { label: 'Critical Path', value: tasks.filter(t => t.is_critical).length, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
                ].map((s, i) => (
                    <div key={i} className="glass-card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: s.color, fontFamily: 'Poppins,sans-serif' }}>{s.value}</div>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Gantt Chart */}
            <div className="glass-card section-card" style={{ marginBottom: 20 }}>
                <div className="flex-between" style={{ marginBottom: 16 }}>
                    <div className="section-card-title" style={{ margin: 0 }}>
                        <span className="title-icon">📅</span>
                        Gantt Chart — {activeProject?.name || 'Project'}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent-rose)' }}>
                            <span style={{ width: 12, height: 2, background: 'var(--accent-rose)', display: 'inline-block' }} /> Critical
                        </span>
                    </div>
                </div>

                {tasks.length === 0 ? (
                    <EmptyState icon="📅" title="No Tasks Scheduled" sub="Create tasks to see them on the Gantt chart. Assign phases, durations, and assignees." action="Add First Task" onAction={() => setShowForm(true)} />
                ) : (
                    <div className="table-responsive">
                        <div style={{ minWidth: 600 }}>
                            {/* Month headers */}
                            <div style={{ display: 'flex', marginLeft: 180, marginBottom: 6 }}>
                                {months.map((m, i) => (
                                    <div key={i} style={{ flex: 1, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600, letterSpacing: '0.5px' }}>{m}</div>
                                ))}
                            </div>
                            <div>
                                {tasks.map((task) => {
                                const phaseColor = PHASE_COLORS[task.phase_name] || '#10b981';
                                return (
                                    <div key={task.task_id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, height: 36 }}>
                                        <div style={{ width: 180, flexShrink: 0, paddingRight: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {task.is_critical ? <span title="Critical" style={{ color: '#f43f5e', fontSize: 10, fontWeight: 800 }}>●</span> : null}
                                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</span>
                                        </div>
                                        <div style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
                                            <div style={{ position: 'absolute', inset: '6px 0', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
                                            <div
                                                title={`${task.name}: Day ${task.start_day}–${task.start_day + task.duration_days}`}
                                                style={{
                                                    position: 'absolute',
                                                    left: `${Math.min((task.start_day / TOTAL_DAYS) * 100, 95)}%`,
                                                    width: `${Math.max((task.duration_days / TOTAL_DAYS) * 100, 2)}%`,
                                                    height: 22, borderRadius: 6,
                                                    background: task.is_critical
                                                        ? 'linear-gradient(90deg, rgba(244,63,94,0.8), rgba(244,63,94,0.6))'
                                                        : `linear-gradient(90deg, ${phaseColor}cc, ${phaseColor}88)`,
                                                    border: task.is_critical ? '1px solid rgba(244,63,94,0.5)' : `1px solid ${phaseColor}44`,
                                                    display: 'flex', alignItems: 'center', paddingLeft: 8, overflow: 'hidden', cursor: 'pointer',
                                                    boxShadow: task.is_critical ? '0 2px 10px rgba(244,63,94,0.2)' : 'none',
                                                }}
                                            >
                                                <span style={{ fontSize: 10, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.name}</span>
                                            </div>
                                            {task.avatar_initials && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: `calc(${Math.min(((task.start_day + task.duration_days) / TOTAL_DAYS) * 100, 95)}% + 4px)`,
                                                    width: 20, height: 20, borderRadius: '50%', background: '#10b981',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff',
                                                }}>
                                                    {task.avatar_initials}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Task Table */}
            <div className="glass-card section-card">
                <div className="flex-between" style={{ marginBottom: 16 }}>
                    <div className="section-card-title" style={{ margin: 0 }}><span className="title-icon">📋</span>Task Register</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="search-bar" style={{ flex: '1 1 180px' }}>
                            <MdSearch size={14} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." />
                        </div>
                        {['all', 'done', 'active', 'pending', 'critical'].map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                {filtered.length === 0 ? (
                    <EmptyState icon="📋" title={tasks.length === 0 ? "No Tasks Yet" : "No Matching Tasks"} sub={tasks.length === 0 ? "Click \"New Task\" to add your first task to this project." : "Try changing your filters or search query."} />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <div className="table-responsive">
                            <table className="pmis-table">
                            <thead>
                                <tr><th>ID</th><th>Task Name</th><th>Phase</th><th>Start Day</th><th>Duration</th><th>Dependencies</th><th>Assignee</th><th>Status</th><th>Critical</th></tr>
                            </thead>
                            <tbody>
                                {filtered.map(task => (
                                    <tr key={task.task_id}>
                                        <td style={{ color: 'var(--text-muted)' }}>#{task.task_id}</td>
                                        <td style={{ fontWeight: 600 }}>{task.name}</td>
                                        <td><span style={{ color: PHASE_COLORS[task.phase_name] || '#10b981', fontWeight: 600, fontSize: 12 }}>{task.phase_name || '—'}</span></td>
                                        <td style={{ color: 'var(--text-secondary)' }}>Day {task.start_day}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{task.duration_days}d</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{task.dependencies?.length ? task.dependencies.map(d => `#${d}`).join(', ') : '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {task.avatar_initials ? (
                                                    <div className="avatar" style={{ width: 26, height: 26, fontSize: 9, background: '#10b981' }}>{task.avatar_initials}</div>
                                                ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                            </div>
                                        </td>
                                        <td><span className={`badge badge-${task.status === 'done' ? 'success' : task.status === 'active' ? 'info' : 'warning'}`}>{task.status}</span></td>
                                        <td>{task.is_critical ? <span className="badge badge-danger">Critical</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Task Modal */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ padding: 32, width: 480, border: '1px solid rgba(16,185,129,0.3)' }}>
                        <div className="flex-between" style={{ marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700 }}>New Task</h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input className="pmis-input" placeholder="Task name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            <select className="pmis-input" value={form.phase_id} onChange={e => setForm({ ...form, phase_id: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)' }}>
                                <option value="">Select phase (optional)</option>
                                {phases.map(p => <option key={p.phase_id} value={p.phase_id}>{p.phase_name}</option>)}
                            </select>
                            <div className="form-grid-2">
                                <input className="pmis-input" type="number" placeholder="Start day *" value={form.start_day} onChange={e => setForm({ ...form, start_day: e.target.value })} />
                                <input className="pmis-input" type="number" placeholder="Duration (days) *" value={form.duration_days} onChange={e => setForm({ ...form, duration_days: e.target.value })} />
                            </div>
                            <select className="pmis-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)' }}>
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="done">Done</option>
                            </select>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.is_critical} onChange={e => setForm({ ...form, is_critical: e.target.checked })} />
                                Mark as Critical Path
                            </label>
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreate}>Create Task</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
