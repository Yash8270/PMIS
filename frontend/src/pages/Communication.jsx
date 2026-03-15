import { useState, useContext, useEffect } from 'react';
import PMISContext from '../context/PMISContext';
import { MdAdd, MdSend, MdDelete } from 'react-icons/md';

const priorityColors = { high: '#f43f5e', medium: '#f59e0b', low: '#10b981' };

const EmptyState = ({ icon, title, sub, action, onAction }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 14 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', border: '2px dashed rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{icon}</div>
        <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 320 }}>{sub}</p>
        {action && <button className="btn btn-primary" onClick={onAction}><MdAdd /> {action}</button>}
    </div>
);

export default function Communication() {
    const { channels, messages, announcements, workspaces, activeProject, activeChannel, setActiveChannel, createChannel, fetchMessages, sendMessage, deleteMessage, createAnnouncement, createWorkspace } = useContext(PMISContext);
    const [tab, setTab] = useState('channels');
    const [msgText, setMsgText] = useState('');
    const [showChannelForm, setShowChannelForm] = useState(false);
    const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
    const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
    const [channelForm, setChannelForm] = useState({ channel_name: '', description: '' });
    const [announceForm, setAnnounceForm] = useState({ title: '', body: '', priority: 'medium' });
    const [wsForm, setWsForm] = useState({ name: '', icon: '🏗️', status: 'active' });

    useEffect(() => {
        if (activeChannel?.channel_id) fetchMessages(activeChannel.channel_id);
    }, [activeChannel?.channel_id]);

    const handleSend = async () => {
        if (!activeChannel || !msgText.trim()) return;
        await sendMessage(activeChannel.channel_id, msgText.trim());
        setMsgText('');
    };

    const handleCreateChannel = async () => {
        if (!activeProject || !channelForm.channel_name) return;
        await createChannel({ project_id: activeProject.project_id, ...channelForm });
        setShowChannelForm(false);
        setChannelForm({ channel_name: '', description: '' });
    };

    const handleCreateAnnouncement = async () => {
        if (!activeProject || !announceForm.title || !announceForm.body) return;
        await createAnnouncement({ project_id: activeProject.project_id, ...announceForm });
        setShowAnnouncementForm(false);
        setAnnounceForm({ title: '', body: '', priority: 'medium' });
    };

    const handleCreateWorkspace = async () => {
        if (!activeProject || !wsForm.name) return;
        await createWorkspace({ project_id: activeProject.project_id, ...wsForm });
        setShowWorkspaceForm(false);
        setWsForm({ name: '', icon: '🏗️', status: 'active' });
    };

    return (
        <div className="animate-fadeInUp">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Communication & Collaboration</h1>
                    <p className="page-subtitle">Team channels, announcements & workspaces</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {tab === 'channels' && <button className="btn btn-primary" onClick={() => setShowChannelForm(true)}><MdAdd /> New Channel</button>}
                    {tab === 'announcements' && <button className="btn btn-primary" onClick={() => setShowAnnouncementForm(true)}><MdAdd /> New Announcement</button>}
                    {tab === 'workspaces' && <button className="btn btn-primary" onClick={() => setShowWorkspaceForm(true)}><MdAdd /> New Workspace</button>}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {['channels', 'announcements', 'workspaces'].map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`} style={{ textTransform: 'capitalize' }}>
                        {t === 'channels' ? '💬' : t === 'announcements' ? '📢' : '🗂️'} {t}
                    </button>
                ))}
            </div>

            {/* ── Channels Tab ── */}
            {tab === 'channels' && (
                channels.length === 0 ? (
                    <div className="glass-card">
                        <EmptyState icon="💬" title="No Channels Yet" sub="Create team channels to organize project communication by topic or work area." action="Create First Channel" onAction={() => setShowChannelForm(true)} />
                    </div>
                ) : (
                    <div className="chat-layout">
                        {/* Channel List */}
                        <div className="glass-card chat-list">
                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Channels</p>
                            {channels.map(c => (
                                <div key={c.channel_id} onClick={() => setActiveChannel(c)}
                                    style={{ padding: '10px 12px', borderRadius: 10, marginBottom: 4, cursor: 'pointer', background: activeChannel?.channel_id === c.channel_id ? 'rgba(16,185,129,0.15)' : 'transparent', border: activeChannel?.channel_id === c.channel_id ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent', transition: '0.2s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, fontWeight: activeChannel?.channel_id === c.channel_id ? 700 : 500, color: 'var(--text-primary)' }}>
                                            # {c.channel_name}
                                        </span>
                                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.member_count || 0}</span>
                                    </div>
                                    {c.description && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</p>}
                                </div>
                            ))}
                        </div>

                        {/* Message Area */}
                        <div className="glass-card chat-messages">
                            {activeChannel ? (
                                <>
                                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: 15 }}># {activeChannel.channel_name}</p>
                                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activeChannel.description || `${activeChannel.member_count || 0} members`}</p>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {messages.length === 0 ? (
                                            <EmptyState icon="💬" title="No Messages Yet" sub="Be the first to send a message in this channel." />
                                        ) : (
                                            messages.map((msg, i) => (
                                                <div key={msg.message_id} style={{ display: 'flex', gap: 10 }}>
                                                    <div className="avatar" style={{ width: 32, height: 32, fontSize: 10, background: '#10b981', flexShrink: 0 }}>{msg.avatar_initials || msg.sender_name?.[0] || '?'}</div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                                            <span style={{ fontSize: 13, fontWeight: 700 }}>{msg.sender_name}</span>
                                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{msg.role}</span>
                                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{msg.message_text}</p>
                                                    </div>
                                                    <button onClick={() => deleteMessage(msg.message_id, activeChannel.channel_id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.5, fontSize: 14, padding: '0 4px', flexShrink: 0 }} title="Delete">✕</button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: 10, flexShrink: 0 }}>
                                        <input
                                            className="pmis-input"
                                            style={{ flex: 1 }}
                                            placeholder={`Message #${activeChannel.channel_name}...`}
                                            value={msgText}
                                            onChange={e => setMsgText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                                        />
                                        <button className="btn btn-primary" onClick={handleSend} disabled={!msgText.trim()}>
                                            <MdSend size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <EmptyState icon="💬" title="Select a Channel" sub="Choose a channel from the left to view and send messages." />
                            )}
                        </div>
                    </div>
                )
            )}

            {/* ── Announcements Tab ── */}
            {tab === 'announcements' && (
                announcements.length === 0 ? (
                    <div className="glass-card">
                        <EmptyState icon="📢" title="No Announcements" sub="Post announcements to keep your team informed about important project updates." action="Post Announcement" onAction={() => setShowAnnouncementForm(true)} />
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {announcements.map(a => (
                            <div key={a.announcement_id} className="glass-card" style={{ padding: '18px 22px', borderLeft: `3px solid ${priorityColors[a.priority] || '#10b981'}` }}>
                                <div className="flex-between" style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: priorityColors[a.priority], background: `${priorityColors[a.priority]}18`, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{a.priority}</span>
                                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{a.title}</h3>
                                    </div>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(a.posted_at).toLocaleDateString()}</span>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{a.body}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                                    <div className="avatar" style={{ width: 24, height: 24, fontSize: 9, background: '#10b981' }}>{a.avatar_initials || a.posted_by_name?.[0] || '?'}</div>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.posted_by_name || 'Project Manager'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* ── Workspaces Tab ── */}
            {tab === 'workspaces' && (
                workspaces.length === 0 ? (
                    <div className="glass-card">
                        <EmptyState icon="🗂️" title="No Workspaces Yet" sub="Create collaborative workspaces to group teams by discipline or work area." action="Create Workspace" onAction={() => setShowWorkspaceForm(true)} />
                    </div>
                ) : (
                    <div className="grid-4">
                        {workspaces.map(w => (
                            <div key={w.workspace_id} className="glass-card" style={{ padding: '20px 22px', cursor: 'pointer' }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>{w.icon || '🗂️'}</div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{w.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 12, color: w.status === 'active' ? '#10b981' : '#64748b', fontWeight: 600 }}>
                                        ● {w.status}
                                    </span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.member_count || 0} members</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* ── Modals ── */}
            {showChannelForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ padding: 32, width: '100%', maxWidth: 420, border: '1px solid rgba(16,185,129,0.3)' }}>
                        <div className="flex-between" style={{ marginBottom: 20 }}><h2 style={{ fontSize: 18, fontWeight: 700 }}>New Channel</h2><button className="btn btn-secondary btn-sm" onClick={() => setShowChannelForm(false)}>✕</button></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input className="pmis-input" placeholder="Channel name *" value={channelForm.channel_name} onChange={e => setChannelForm({ ...channelForm, channel_name: e.target.value })} />
                            <input className="pmis-input" placeholder="Description" value={channelForm.description} onChange={e => setChannelForm({ ...channelForm, description: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowChannelForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateChannel}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {showAnnouncementForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ padding: 32, width: '100%', maxWidth: 480, border: '1px solid rgba(16,185,129,0.3)' }}>
                        <div className="flex-between" style={{ marginBottom: 20 }}><h2 style={{ fontSize: 18, fontWeight: 700 }}>New Announcement</h2><button className="btn btn-secondary btn-sm" onClick={() => setShowAnnouncementForm(false)}>✕</button></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input className="pmis-input" placeholder="Title *" value={announceForm.title} onChange={e => setAnnounceForm({ ...announceForm, title: e.target.value })} />
                            <textarea className="pmis-input" placeholder="Body *" rows={4} value={announceForm.body} onChange={e => setAnnounceForm({ ...announceForm, body: e.target.value })} style={{ resize: 'none' }} />
                            <select className="pmis-input" value={announceForm.priority} onChange={e => setAnnounceForm({ ...announceForm, priority: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)' }}>
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowAnnouncementForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateAnnouncement}>Post</button>
                        </div>
                    </div>
                </div>
            )}

            {showWorkspaceForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ padding: 32, width: '100%', maxWidth: 380, border: '1px solid rgba(16,185,129,0.3)' }}>
                        <div className="flex-between" style={{ marginBottom: 20 }}><h2 style={{ fontSize: 18, fontWeight: 700 }}>New Workspace</h2><button className="btn btn-secondary btn-sm" onClick={() => setShowWorkspaceForm(false)}>✕</button></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input className="pmis-input" placeholder="Workspace name *" value={wsForm.name} onChange={e => setWsForm({ ...wsForm, name: e.target.value })} />
                            <input className="pmis-input" placeholder="Icon emoji (e.g. 🏗️)" value={wsForm.icon} onChange={e => setWsForm({ ...wsForm, icon: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowWorkspaceForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateWorkspace}>Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
