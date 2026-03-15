import { useLocation } from 'react-router-dom';
import { MdSearch, MdNotifications, MdSettings } from 'react-icons/md';
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
};

export default function Topbar({ collapsed }) {
    const location = useLocation();
    const title = routeTitles[location.pathname] || 'PMIS';

    return (
        <header className={`topbar ${collapsed ? 'collapsed' : ''}`}>
            <div className="topbar-left">
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

                <button className="icon-btn notification-btn">
                    <MdNotifications />
                    <span className="notif-dot" />
                </button>

                <button className="icon-btn">
                    <MdSettings />
                </button>

                <div className="avatar topbar-avatar" style={{ background: 'var(--gradient-primary)' }}>
                    YL
                </div>
            </div>
        </header>
    );
}
