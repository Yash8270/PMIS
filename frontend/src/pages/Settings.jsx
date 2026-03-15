import { useState, useEffect } from 'react';
import { MdSettings, MdLock, MdNotifications, MdPalette, MdEmail } from 'react-icons/md';

export default function Settings() {
    // Local persistence for settings
    const [preferences, setPreferences] = useState({
        language: 'English',
        timezone: 'UTC (GMT+0)',
        emailAlerts: true,
        theme: 'emerald'
    });

    useEffect(() => {
        const saved = localStorage.getItem('pmis_preferences');
        if (saved) {
            try { setPreferences(JSON.parse(saved)); } catch(e) {}
        }
    }, []);

    const updatePreference = (key, value) => {
        const newPrefs = { ...preferences, [key]: value };
        setPreferences(newPrefs);
        localStorage.setItem('pmis_preferences', JSON.stringify(newPrefs));
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Configure your PMIS experience</p>
            </div>

            <div className="grid-2 stagger-children">
                {/* Account Settings */}
                <div className="glass-card section-card animate-fadeInUp">
                    <h2 className="section-card-title">
                        <div className="title-icon"><MdSettings /></div>
                        Account Preferences
                    </h2>
                    
                    <div className="flex-col gap-20" style={{ marginTop: 24 }}>
                        <div className="flex-between">
                            <div>
                                <h4 style={{ margin: 0, fontSize: 14 }}>Language</h4>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Choose your preferred language</p>
                            </div>
                            <select 
                                className="pmis-input" 
                                style={{ width: 140 }}
                                value={preferences.language}
                                onChange={(e) => updatePreference('language', e.target.value)}
                            >
                                <option>English</option>
                                <option>Spanish</option>
                                <option>French</option>
                            </select>
                        </div>
                        
                        <div className="divider" style={{ margin: '10px 0' }} />
                        
                        <div className="flex-between">
                            <div>
                                <h4 style={{ margin: 0, fontSize: 14 }}>Timezone</h4>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Set your local timezone</p>
                            </div>
                            <select 
                                className="pmis-input" 
                                style={{ width: 140 }}
                                value={preferences.timezone}
                                onChange={(e) => updatePreference('timezone', e.target.value)}
                            >
                                <option>UTC (GMT+0)</option>
                                <option>EST (GMT-5)</option>
                                <option>PST (GMT-8)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notifications & Security */}
                <div className="glass-card section-card animate-fadeInUp">
                    <h2 className="section-card-title">
                        <div className="title-icon"><MdNotifications /></div>
                        Alerts & Security
                    </h2>
                    
                    <div className="flex-col gap-20" style={{ marginTop: 24 }}>
                        <div className="flex-between">
                            <div className="flex gap-12 flex-center">
                                <MdEmail size={20} color="var(--text-secondary)" />
                                <div>
                                    <h4 style={{ margin: 0, fontSize: 14 }}>Email Notifications</h4>
                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Daily project digests</p>
                                </div>
                            </div>
                            {/* Toggle */}
                            <div 
                                onClick={() => updatePreference('emailAlerts', !preferences.emailAlerts)}
                                style={{ 
                                    width: 44, height: 24, borderRadius: 12, 
                                    background: preferences.emailAlerts ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.1)', 
                                    position: 'relative', cursor: 'pointer',
                                    transition: 'background 0.3s'
                                }}
                            >
                                <div style={{ 
                                    position: 'absolute', 
                                    left: preferences.emailAlerts ? 22 : 2, 
                                    top: 2, width: 20, height: 20, borderRadius: '50%', 
                                    background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }} />
                            </div>
                        </div>

                        <div className="divider" style={{ margin: '10px 0' }} />

                        <div className="flex-between">
                            <div className="flex gap-12 flex-center">
                                <MdLock size={20} color="var(--text-secondary)" />
                                <div>
                                    <h4 style={{ margin: 0, fontSize: 14 }}>Two-Factor Auth</h4>
                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Enhance account security</p>
                                </div>
                            </div>
                            <button className="btn btn-secondary btn-sm">Enable</button>
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="glass-card section-card animate-fadeInUp" style={{ gridColumn: '1 / -1' }}>
                    <h2 className="section-card-title">
                        <div className="title-icon"><MdPalette /></div>
                        Appearance
                    </h2>
                    
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                        Customize the look and feel of the PMIS interface.
                    </p>

                    <div className="flex gap-20">
                        <div 
                            onClick={() => updatePreference('theme', 'emerald')}
                            style={{ 
                                padding: '16px 24px', 
                                background: preferences.theme === 'emerald' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', 
                                border: `1px solid ${preferences.theme === 'emerald' ? 'var(--accent-primary)' : 'var(--border-glass)'}`, 
                                borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            <div className="flex flex-center gap-12">
                                <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                                <span style={{ fontWeight: 600, fontSize: 14, color: preferences.theme === 'emerald' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                                    Emerald Dark {preferences.theme === 'emerald' && '(Active)'}
                                </span>
                            </div>
                        </div>
                        <div 
                            onClick={() => updatePreference('theme', 'ocean')}
                            style={{ 
                                padding: '16px 24px', 
                                background: preferences.theme === 'ocean' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)', 
                                border: `1px solid ${preferences.theme === 'ocean' ? '#3b82f6' : 'var(--border-glass)'}`, 
                                borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            <div className="flex flex-center gap-12">
                                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#3b82f6' }} />
                                <span style={{ fontWeight: 600, fontSize: 14, color: preferences.theme === 'ocean' ? '#3b82f6' : 'var(--text-secondary)' }}>
                                    Ocean Blue {preferences.theme === 'ocean' && '(Active)'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
