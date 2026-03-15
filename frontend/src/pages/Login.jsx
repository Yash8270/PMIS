import { useState, useContext } from 'react';
import PMISContext from '../context/PMISContext';
import { MdEmail, MdLock, MdPerson, MdBadge, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const ROLES = ['admin', 'pm', 'engineer', 'coordinator', 'qa', 'viewer'];

export default function Login() {
    const { login, register } = useContext(PMISContext);
    const [tab, setTab] = useState('login'); // 'login' | 'register'
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [regForm, setRegForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'engineer' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!loginForm.email || !loginForm.password) { setError('Please fill in all fields.'); return; }
        setLoading(true);
        const res = await login(loginForm.email, loginForm.password);
        setLoading(false);
        if (!res.success) setError(res.message || 'Login failed.');
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!regForm.name || !regForm.email || !regForm.password || !regForm.role) { setError('All fields are required.'); return; }
        if (regForm.password !== regForm.confirmPassword) { setError('Passwords do not match.'); return; }
        if (regForm.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true);
        const res = await register(regForm);
        setLoading(false);
        if (res.success) {
            setSuccess('Account created! You can now log in.');
            setTab('login');
            setLoginForm({ email: regForm.email, password: '' });
            setRegForm({ name: '', email: '', password: '', confirmPassword: '', role: 'engineer' });
        } else {
            setError(res.message || 'Registration failed.');
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden',
            background: 'var(--bg-primary)',
        }}>
            {/* Animated background blobs */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', top: '-10%', left: '-10%', animation: 'pulse-ring 8s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)', bottom: '-8%', right: '-8%', animation: 'pulse-ring 10s ease-in-out infinite reverse' }} />
                <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            </div>

            {/* Left Panel — Branding */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '60px 48px', position: 'relative', zIndex: 1,
                borderRight: '1px solid rgba(16,185,129,0.1)',
            }} className="left-panel-hide">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, fontFamily: 'Poppins', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}>P</div>
                    <div>
                        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Poppins', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.5px' }}>PMIS</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: -2 }}>Project Management</div>
                    </div>
                </div>

                <h2 style={{ fontFamily: 'Poppins', fontSize: 36, fontWeight: 800, lineHeight: 1.2, marginBottom: 20, letterSpacing: '-1px', maxWidth: 420, textAlign: 'center', background: 'linear-gradient(135deg, #f1f5f9, #6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Everything your project team needs
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, textAlign: 'center', maxWidth: 380, lineHeight: 1.7, marginBottom: 52 }}>
                    Plan, track, collaborate, and deliver — all in one powerful platform designed for construction &amp; engineering projects.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 }}>
                    {[
                        { icon: '📅', label: 'Planning & Gantt Scheduling' },
                        { icon: '💰', label: 'Cost Management & EVM Reporting' },
                        { icon: '👥', label: 'Resource & Document Management' },
                        { icon: '⚠️', label: 'Risk Register & Collaboration' },
                    ].map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderRadius: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', animation: `fadeInUp 0.5s ease ${i * 0.08 + 0.2}s both` }}>
                            <span style={{ fontSize: 20 }}>{f.icon}</span>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{f.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel — Auth Form */}
            <div style={{
                width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', padding: 40,
                position: 'relative', zIndex: 1,
            }}>
                <div className="glass-card animate-fadeInUp" style={{ width: '100%', padding: '36px 32px', border: '1px solid rgba(16,185,129,0.2)' }}>

                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, fontFamily: 'Poppins', boxShadow: '0 4px 15px rgba(16,185,129,0.35)' }}>P</div>
                        <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 18, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>PMIS</span>
                    </div>

                    {/* Animated title — re-mounts on tab change to trigger slide-up */}
                    <div style={{ overflow: 'hidden', marginBottom: 4 }}>
                        <h1 key={tab} className="auth-title-slide" style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: 700 }}>
                            {tab === 'login' ? 'Welcome back' : 'Create your account'}
                        </h1>
                    </div>
                    <div style={{ overflow: 'hidden', marginBottom: 24 }}>
                        <p key={tab + '-sub'} className="auth-subtitle-slide" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                            {tab === 'login' ? 'Sign in to access your PMIS dashboard' : 'Join your project team on PMIS'}
                        </p>
                    </div>

                    {/* Tab Switch — sliding pill */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginBottom: 24, position: 'relative' }}>
                        {/* sliding active pill */}
                        <div style={{
                            position: 'absolute', top: 4, bottom: 4,
                            width: 'calc(50% - 4px)',
                            borderRadius: 7,
                            background: 'var(--gradient-primary)',
                            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: tab === 'login' ? 'translateX(0px)' : 'translateX(calc(100% + 8px))',
                            pointerEvents: 'none',
                        }} />
                        {['login', 'register'].map(t => (
                            <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); }}
                                style={{
                                    flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
                                    fontSize: 13, fontWeight: 600, fontFamily: 'Inter',
                                    background: 'transparent',
                                    color: tab === t ? '#fff' : 'var(--text-muted)',
                                    transition: 'color 0.3s ease',
                                    position: 'relative', zIndex: 1,
                                }}>
                                {t === 'login' ? 'Sign In' : 'Register'}
                            </button>
                        ))}
                    </div>

                    {/* Error / Success Messages */}
                    {error && (
                        <div className="auth-msg-error" style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
                            ⚠️ {error}
                        </div>
                    )}
                    {success && (
                        <div className="auth-msg-success" style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: 13, marginBottom: 16 }}>
                            ✅ {success}
                        </div>
                    )}

                    {/* ── Sliding Forms Container ─────────────────────────── */}
                    <div style={{ position: 'relative', overflow: 'hidden' }}>

                        {/* LOGIN FORM — slides left when inactive */}
                        <div style={{
                            transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
                            transform: tab === 'login' ? 'translateX(0%)' : 'translateX(-55%)',
                            opacity: tab === 'login' ? 1 : 0,
                            pointerEvents: tab === 'login' ? 'auto' : 'none',
                            position: tab === 'login' ? 'relative' : 'absolute',
                            top: 0, left: 0, right: 0,
                        }}>
                            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <InputField icon={<MdEmail />} type="email" placeholder="Work email" value={loginForm.email}
                                    onChange={v => setLoginForm({ ...loginForm, email: v })} />
                                <InputField icon={<MdLock />} type={showPass ? 'text' : 'password'} placeholder="Password"
                                    value={loginForm.password} onChange={v => setLoginForm({ ...loginForm, password: v })}
                                    rightIcon={showPass ? <MdVisibilityOff /> : <MdVisibility />}
                                    onRightIcon={() => setShowPass(!showPass)} />
                                <button type="submit" className="btn btn-primary" disabled={loading}
                                    style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                                    {loading ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> : null}
                                    {loading ? ' Signing in...' : 'Sign In'}
                                </button>
                            </form>
                        </div>

                        {/* REGISTER FORM — slides right when inactive */}
                        <div style={{
                            transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
                            transform: tab === 'register' ? 'translateX(0%)' : 'translateX(55%)',
                            opacity: tab === 'register' ? 1 : 0,
                            pointerEvents: tab === 'register' ? 'auto' : 'none',
                            position: tab === 'register' ? 'relative' : 'absolute',
                            top: 0, left: 0, right: 0,
                        }}>
                            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                                <InputField icon={<MdPerson />} type="text" placeholder="Full name" value={regForm.name}
                                    onChange={v => setRegForm({ ...regForm, name: v })} />
                                <InputField icon={<MdEmail />} type="email" placeholder="Work email" value={regForm.email}
                                    onChange={v => setRegForm({ ...regForm, email: v })} />

                                <div style={{ position: 'relative' }}>
                                    <MdBadge style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18 }} />
                                    <select className="pmis-input" value={regForm.role}
                                        onChange={e => setRegForm({ ...regForm, role: e.target.value })}
                                        style={{ paddingLeft: 38, background: 'rgba(255,255,255,0.05)', textTransform: 'capitalize' }}>
                                        {ROLES.map(r => <option key={r} value={r} style={{ background: '#0a1a10', textTransform: 'capitalize' }}>{r}</option>)}
                                    </select>
                                </div>

                                <InputField icon={<MdLock />} type={showPass ? 'text' : 'password'} placeholder="Password (min 6 chars)"
                                    value={regForm.password} onChange={v => setRegForm({ ...regForm, password: v })}
                                    rightIcon={showPass ? <MdVisibilityOff /> : <MdVisibility />}
                                    onRightIcon={() => setShowPass(!showPass)} />
                                <InputField icon={<MdLock />} type={showPass ? 'text' : 'password'} placeholder="Confirm password"
                                    value={regForm.confirmPassword} onChange={v => setRegForm({ ...regForm, confirmPassword: v })} />

                                <button type="submit" className="btn btn-primary" disabled={loading}
                                    style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                                    {loading ? '⏳ Creating account...' : 'Create Account'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
                        {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>
                            {tab === 'login' ? 'Register here' : 'Sign in'}
                        </button>
                    </p>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 20, textAlign: 'center' }}>
                    © 2026 PMIS. Secure, enterprise-grade project management.
                </p>
            </div>

            <style>{`
                @media (max-width: 768px) { .left-panel-hide { display: none !important; } }

                /* Title / subtitle slide-up on tab change */
                @keyframes authTitleIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .auth-title-slide {
                    animation: authTitleIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
                }
                .auth-subtitle-slide {
                    animation: authTitleIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) 0.05s both;
                }

                /* Error / success pop-in */
                @keyframes authMsgIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .auth-msg-error, .auth-msg-success {
                    animation: authMsgIn 0.3s ease both;
                }
            `}</style>
        </div>
    );
}

// ── Reusable input field with icon ───────────────────────────────────────────
function InputField({ icon, type, placeholder, value, onChange, rightIcon, onRightIcon }) {
    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: 12, color: 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                {icon}
            </div>
            <input className="pmis-input" type={type} placeholder={placeholder} value={value}
                onChange={e => onChange(e.target.value)}
                style={{ paddingLeft: 38, paddingRight: rightIcon ? 40 : 14 }}
                required />
            {rightIcon && (
                <button type="button" onClick={onRightIcon}
                    style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center' }}>
                    {rightIcon}
                </button>
            )}
        </div>
    );
}
