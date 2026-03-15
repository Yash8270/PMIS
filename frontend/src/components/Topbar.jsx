import { useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import PMISContext from '../context/PMISContext';
import { MdSearch, MdNotifications, MdSettings, MdMenu } from 'react-icons/md';
import './Topbar.css';

const routeTitles = {
    '/': 'Dashboard',
    '/planning': 'Planning & Scheduling',
    '/cost': 'Cost Management',
    '/resources': 'Resource Management',
    '/documents': 'Document Management',
    '/communication': 'Communication & Collaboration',
    '/risks': 'Risk Management',
    '/reporting': 'Reporting & Decision Support',
    '/profile': 'My Profile',
    '/settings': 'Settings',
    '/notifications': 'Notifications',
};

export default function Topbar({ collapsed, onToggleMobile }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { authdata } = useContext(PMISContext);
    
    const title = routeTitles[location.pathname] || 'PMIS';
    const user = authdata?.user || authdata; // Handle potential nesting depending on how login returns it
    const userInitials = user?.avatar_initials ? user.avatar_initials : user?.name ? user.name.substring(0, 2).toUpperCase() : 'U';

    return (
        <header className={`topbar ${collapsed ? 'collapsed' : ''}`}>
            <div className="topbar-left">
                <button className="icon-btn mobile-menu-btn" onClick={onToggleMobile}>
                    <MdMenu />
                </button>
                <div className="breadcrumb">
                    <span className="breadcrumb-root">PMIS</span>
                    <span className="breadcrumb-sep">›</span>
                    <span className="breadcrumb-current">{title}</span>
                </div>
            </div>

            <div className="topbar-right">
                <div className="search-bar">
                    <MdSearch size={16} />
                    <input placeholder="Search..." />
                </div>

                <button className="icon-btn notification-btn" onClick={() => navigate('/notifications')}>
                    <MdNotifications />
                    <span className="notif-dot" />
                </button>

                <button className="icon-btn" onClick={() => navigate('/settings')}>
                    <MdSettings />
                </button>

                <div 
                    className="avatar topbar-avatar" 
                    style={{ background: 'var(--gradient-primary)', cursor: 'pointer' }}
                    onClick={() => navigate('/profile')}
                    title="My Profile"
                >
                    {userInitials}
                </div>
            </div>
        </header>
    );
}
