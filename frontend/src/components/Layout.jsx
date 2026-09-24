import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileCheck, 
  FileText, 
  ShieldAlert, 
  History, 
  Users, 
  Bell, 
  User, 
  LogOut,
  Lock
} from 'lucide-react';
import PageTransition from './PageTransition';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
  { to: '/cases', label: 'Cases', icon: Briefcase, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
  { to: '/evidence', label: 'Evidence', icon: FileCheck, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
  { to: '/reports', label: 'Reports', icon: FileText, roles: ['ADMIN', 'SUPERVISOR'] },
  { to: '/security', label: 'Security Center', icon: ShieldAlert, roles: ['ADMIN', 'SUPERVISOR'] },
  { to: '/audit-logs', label: 'Audit Logs', icon: History, roles: ['ADMIN', 'SUPERVISOR'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
  { to: '/profile', label: 'Profile', icon: User, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
];

const PATH_TITLES = {
  '/dashboard': 'Overview',
  '/cases': 'Cases Archive',
  '/evidence': 'Evidence Registry',
  '/reports': 'Intelligence Reports',
  '/security': 'Security Command',
  '/security/events': 'Security Events',
  '/audit-logs': 'Immutable Audit Archive',
  '/users': 'Access Control',
  '/notifications': 'Notifications',
  '/profile': 'Investigator Profile',
  '/evidence/upload': 'Upload Evidence',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadUnread() {
      try {
        const { data } = await api.get('/notifications');
        if (active) setUnread(data.unreadCount);
      } catch {
        // ignore polling failures
      }
    }
    loadUnread();
    const interval = setInterval(loadUnread, 20000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const currentTitle = PATH_TITLES[location.pathname] || 
    (location.pathname.startsWith('/cases/') ? 'Case File Inspection' : 
     location.pathname.startsWith('/evidence/') ? 'Evidence Forensic File' : 
     location.pathname.startsWith('/security/events/') ? 'Security Event' : 'Evidence Vault');

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-container">
          <div className="brand-title-group">
            <span className="brand-title">DIGITAL EVIDENCE VAULT</span>
            <span className="brand-subtitle">CLASSIFIED ARCHIVE</span>
          </div>
        </div>

        <nav className="nav-group">
          {NAV_ITEMS.filter((item) => item.roles.includes(user.role)).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <div className="nav-link-content">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
                {item.to === '/notifications' && unread > 0 && <span className="nav-badge">{unread}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar-pill">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <span className="sidebar-user-name">
                {user.name}
              </span>
              <span className="sidebar-user-role">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-title">{currentTitle}</span>
          </div>

          <div className="topbar-right">
            <div className="system-status-indicator">
              <span className="status-dot-green"></span>
              <Lock size={12} style={{ opacity: 0.7 }} />
              <span>ENCRYPTED VAULT</span>
            </div>

            <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '6px 12px', fontSize: 12 }}>
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        <main className="content">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}

