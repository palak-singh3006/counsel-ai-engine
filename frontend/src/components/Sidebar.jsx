import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarDays,
  FileText,
  IndianRupee,
  Brain,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/matters', label: 'Matters', icon: Briefcase },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/hearings', label: 'Hearing Calendar', icon: CalendarDays },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/financials', label: 'Financials', icon: IndianRupee },
];

const aiItem = { path: '/ai-intelligence', label: 'AI Case Intelligence', icon: Brain };

function getInitials(name) {
  return String(name || 'AD')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, profile } = useAuth();
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Advocate';
  const displayFirm = profile?.firm_name || user?.user_metadata?.firm_name || 'Counsel Chambers';
  const displayRole = profile?.role || 'Advocate';

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />
      <motion.aside
        className={`sidebar ${isOpen ? 'open' : ''}`}
        initial={false}
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">{displayFirm}</div>
          <div className="sidebar-brand-product">Counsel</div>
          <div className="sidebar-brand-subtitle">Legal Practice Management</div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Practice</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="sidebar-section-label" style={{ marginTop: '8px' }}>
            Intelligence
          </div>
          <NavLink
            to={aiItem.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <aiItem.icon />
            <span>{aiItem.label}</span>
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <Settings />
            <span>Settings</span>
          </NavLink>
          <div className="sidebar-profile" style={{ marginTop: '4px' }}>
            <div className="sidebar-avatar">{getInitials(displayName)}</div>
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">{displayName}</div>
              <div className="sidebar-profile-role">{displayRole}</div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
