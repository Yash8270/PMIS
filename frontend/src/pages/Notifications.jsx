import { useContext } from 'react';
import PMISContext from '../context/PMISContext';
import { MdNotifications, MdCheckCircle, MdInfo, MdWarning, MdFlag } from 'react-icons/md';

export default function Notifications() {
    const { announcements } = useContext(PMISContext);

    const getIconForPriority = (priority) => {
        switch(priority) {
            case 'high': return <MdWarning color="#ef4444" />;
            case 'medium': return <MdInfo color="#3b82f6" />;
            case 'low': return <MdCheckCircle color="#10b981" />;
            default: return <MdFlag color="#a8a29e" />;
        }
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Notifications</h1>
                    <p className="page-subtitle">Recent alerts and system updates</p>
                </div>
                {announcements?.length > 0 && <button className="btn btn-secondary btn-sm">Mark All as Read</button>}
            </div>

            <div className="glass-card animate-fadeInUp" style={{ padding: 0, overflow: 'hidden' }}>
                {!announcements || announcements.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <MdNotifications size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p>No new notifications at this time.</p>
                    </div>
                ) : (
                    announcements.map((a, i) => (
                        <div key={a.announcement_id || i} style={{
                            display: 'flex', gap: 16, padding: '20px 24px',
                            borderBottom: i !== announcements.length - 1 ? '1px solid var(--border-glass)' : 'none',
                            background: a.priority === 'high' ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                            transition: 'background 0.2s',
                        }} className="hover-bg">
                            <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>
                                {getIconForPriority(a.priority)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="flex-between">
                                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</h4>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(a.posted_at).toLocaleDateString()}</span>
                                </div>
                                <p style={{ margin: '4px 0 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
                                    {a.body}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                
                {announcements?.length > 0 && (
                    <div style={{ padding: 16, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-glass)' }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            View Older Notifications
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                .hover-bg:hover { background: rgba(255,255,255,0.03) !important; }
            `}</style>
        </div>
    );
}
