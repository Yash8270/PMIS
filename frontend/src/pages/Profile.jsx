import { useContext, useState } from 'react';
import PMISContext from '../context/PMISContext';
import { MdPerson, MdEmail, MdBadge, MdExitToApp, MdEdit, MdSave, MdClose } from 'react-icons/md';

export default function Profile() {
    const { authdata, logout, updateUserDetails } = useContext(PMISContext);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);

    if (!authdata) return null;
    
    const user = authdata?.user || authdata;
    const userInitials = user?.avatar_initials ? user.avatar_initials : user?.name ? user.name.substring(0, 2).toUpperCase() : 'U';

    const handleEditClick = () => {
        setEditName(user.name);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editName.trim()) return;
        setSaving(true);
        // Generate new initials
        const newInitials = editName.substring(0, 2).toUpperCase();
        
        await updateUserDetails(user.user_id, {
            name: editName,
            avatar_initials: newInitials
        });
        
        setSaving(false);
        setIsEditing(false);
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">My Profile</h1>
                <p className="page-subtitle">Manage your account information</p>
            </div>

            <div className="grid-2 stagger-children">
                {/* Profile Overview Card */}
                <div className="glass-card section-card animate-fadeInUp">
                    <div className="flex-between" style={{ marginBottom: 24 }}>
                        <h2 className="section-card-title" style={{ margin: 0 }}>
                            <div className="title-icon"><MdPerson /></div>
                            Profile Details
                        </h2>
                        {!isEditing ? (
                            <button className="btn btn-secondary btn-sm" onClick={handleEditClick}>
                                <MdEdit /> Edit
                            </button>
                        ) : (
                            <div className="flex gap-8">
                                <button className="btn btn-sm" onClick={() => setIsEditing(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
                                    <MdClose /> Cancel
                                </button>
                                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                                    <MdSave /> {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 20,
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 32, fontWeight: 800, fontFamily: 'Poppins',
                            boxShadow: 'box-shadow: 0 8px 24px rgba(16,185,129,0.3)',
                        }}>
                            {isEditing ? editName.substring(0, 2).toUpperCase() : userInitials}
                        </div>
                        <div>
                            {isEditing ? (
                                <input 
                                    className="pmis-input" 
                                    value={editName} 
                                    onChange={(e) => setEditName(e.target.value)}
                                    autoFocus
                                    style={{ fontSize: 20, fontWeight: 700, padding: '8px 12px', width: '100%', maxWidth: 250 }}
                                />
                            ) : (
                                <h3 style={{ fontSize: 24, fontWeight: 700, margin: 0, fontFamily: 'Poppins' }}>{user.name}</h3>
                            )}
                            <div className="badge badge-primary" style={{ marginTop: 8 }}>{user.role}</div>
                        </div>
                    </div>

                    <div className="flex-col gap-16">
                        <div className="flex gap-12" style={{ color: 'var(--text-secondary)' }}>
                            <MdEmail size={20} />
                            <span>{user.email}</span>
                        </div>
                        <div className="flex gap-12" style={{ color: 'var(--text-secondary)' }}>
                            <MdBadge size={20} />
                            <span style={{ textTransform: 'capitalize' }}>Role Access: {user.role}</span>
                        </div>
                    </div>

                    <div className="divider" />
                    
                    <button onClick={logout} className="btn" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
                        <MdExitToApp size={18} /> Sign Out
                    </button>
                </div>

                {/* Activity summary */}
                <div className="glass-card section-card animate-fadeInUp">
                    <h2 className="section-card-title">Recent Activity</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Your recent actions across the PMIS platform.</p>
                    
                    <div className="flex-col gap-16">
                        <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                            <div className="flex-between">
                                <span style={{ fontWeight: 600, fontSize: 14 }}>Logged In</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Just now</span>
                            </div>
                        </div>
                        <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                            <div className="flex-between">
                                <span style={{ fontWeight: 600, fontSize: 14 }}>Viewed Dashboard</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>1 hr ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
