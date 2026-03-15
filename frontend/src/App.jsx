import { useState, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Api from './context/Api.jsx';
import PMISContext from './context/PMISContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import PlanningScheduling from './pages/PlanningScheduling';
import CostManagement from './pages/CostManagement';
import ResourceManagement from './pages/ResourceManagement';
import DocumentManagement from './pages/DocumentManagement';
import Communication from './pages/Communication';
import RiskManagement from './pages/RiskManagement';
import Reporting from './pages/Reporting';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

// Inner component so it can access context
function AppInner() {
  const { authdata, authLoading } = useContext(PMISContext);
  const [collapsed, setCollapsed] = useState(false);

  // Show nothing while restoring session from localStorage / cookie
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, fontFamily: 'Poppins', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(16,185,129,0.35)', animation: 'pulse-ring 2s ease-in-out infinite' }}>P</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading PMIS...</p>
        </div>
      </div>
    );
  }

  // Not logged in → show login page
  if (!authdata) {
    return <Login />;
  }

  // Logged in → show full app
  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Topbar collapsed={collapsed} />
      <main className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/planning" element={<PlanningScheduling />} />
          <Route path="/cost" element={<CostManagement />} />
          <Route path="/resources" element={<ResourceManagement />} />
          <Route path="/documents" element={<DocumentManagement />} />
          <Route path="/communication" element={<Communication />} />
          <Route path="/risks" element={<RiskManagement />} />
          <Route path="/reporting" element={<Reporting />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Api>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </Api>
  );
}
