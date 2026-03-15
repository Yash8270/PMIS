import { NavLink } from 'react-router-dom';
import {
  MdDashboard, MdCalendarToday, MdAttachMoney, MdPeople,
  MdFolder, MdChat, MdWarning, MdBarChart, MdMenu, MdClose
} from 'react-icons/md';
import './Sidebar.css';

const navItems = [
  { to: '/',                  icon: <MdDashboard />,    label: 'Dashboard' },
  { to: '/planning',          icon: <MdCalendarToday />,label: 'Planning & Scheduling' },
  { to: '/cost',              icon: <MdAttachMoney />,  label: 'Cost Management' },
  { to: '/resources',         icon: <MdPeople />,       label: 'Resources' },
  { to: '/documents',         icon: <MdFolder />,       label: 'Documents' },
  { to: '/communication',     icon: <MdChat />,         label: 'Communication' },
  { to: '/risks',             icon: <MdWarning />,      label: 'Risk Management' },
  { to: '/reporting',         icon: <MdBarChart />,     label: 'Reporting' },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <span className="brand-icon">⬡</span>
          {!collapsed && <span className="brand-text">PMIS <span className="brand-accent">Pro</span></span>}
        </div>
        <button className="collapse-btn" onClick={onToggle}>
          {collapsed ? <MdMenu /> : <MdClose />}
        </button>
      </div>

      {/* Label */}
      {!collapsed && <p className="nav-label">MAIN MENU</p>}

      {/* Nav Items */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? label : ''}
          >
            <span className="nav-icon">{icon}</span>
            {!collapsed && <span className="nav-label-text">{label}</span>}
            {!collapsed && <span className="nav-indicator" />}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar" style={{ background: 'var(--gradient-primary)' }}>YL</div>
            <div className="user-info">
              <p className="user-name">Yash Limbachiya</p>
              <p className="user-role">Project Manager</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
