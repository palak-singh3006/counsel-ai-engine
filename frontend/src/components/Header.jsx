import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  User,
  Settings,
  LogOut,
  Briefcase,
  Users,
  ChevronRight,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { caseService, clientService, dashboardService } from '../services/api';
import { useToast } from './Toast';

const routeTitles = {
  '/': 'Dashboard',
  '/matters': 'Matters',
  '/clients': 'Clients',
  '/hearings': 'Hearing Calendar',
  '/documents': 'Documents',
  '/financials': 'Financials',
  '/ai-intelligence': 'AI Case Intelligence',
  '/settings': 'Settings',
};

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, profile, logout } = useAuth();

  const [notificationList, setNotificationList] = useState([]);
  const [casesList, setCasesList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function loadHeaderData() {
      try {
        const [casesRes, clientsRes, dashRes] = await Promise.all([
          caseService.getAll(),
          clientService.getAll(),
          dashboardService.getStats(),
        ]);
        if (!active) return;

        setCasesList(casesRes.data?.data || []);
        setClientsList(clientsRes.data?.data || []);

        const stats = dashRes.data?.data;
        const derivedNotifs = [];
        for (const h of stats?.todaysHearingsList || []) {
          derivedNotifs.push({
            id: `h-${h.id}`,
            title: `Hearing today at ${h.time}`,
            text: `${h.caseTitle} — ${h.court}`,
            time: 'Today',
            unread: true,
          });
        }
        for (const p of stats?.overduePaymentsList || []) {
          derivedNotifs.push({
            id: `p-${p.id}`,
            title: 'Payment pending / overdue',
            text: `₹${Number(p.pendingBalance).toLocaleString('en-IN')} due — ${p.client || p.caseTitle}`,
            time: p.status,
            unread: true,
          });
        }
        setNotificationList(derivedNotifs);
      } catch {
        // Silently degrade header search/notifications if offline
      }
    }
    loadHeaderData();
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const pageTitle = routeTitles[location.pathname] || 'Dashboard';
  const unreadCount = notificationList.filter((n) => n.unread).length;

  const matchedCases = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return [];
    return casesList
      .filter(
        (c) =>
          (c.title || '').toLowerCase().includes(q) ||
          (c.case_number || '').toLowerCase().includes(q) ||
          (c.client || '').toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [searchValue, casesList]);

  const matchedClients = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return [];
    return clientsList
      .filter(
        (c) =>
          (c.name || c.full_name || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.client_code || '').toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [searchValue, clientsList]);

  const hasSearchResults = matchedCases.length > 0 || matchedClients.length > 0;

  const handleMarkAllRead = () => {
    setNotificationList((prev) => prev.map((n) => ({ ...n, unread: false })));
    toast('All notifications marked as read', 'info');
  };

  const handleNotificationClick = (n) => {
    setNotificationList((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
    );
    setShowNotifications(false);

    const text = `${n.title} ${n.text}`.toLowerCase();
    if (text.includes('hearing')) {
      navigate('/hearings');
    } else if (text.includes('payment') || text.includes('fee')) {
      navigate('/financials');
    } else if (text.includes('document')) {
      navigate('/documents');
    } else {
      navigate('/matters');
    }
  };

  const handleSelectCase = (caseItem) => {
    setSearchValue('');
    setShowSearchResults(false);
    navigate('/matters', { state: { selectedCaseId: caseItem.id } });
  };

  const handleSelectClient = (clientItem) => {
    setSearchValue('');
    setShowSearchResults(false);
    navigate('/clients', { state: { selectedClientId: clientItem.id } });
  };

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowProfile(false);
        setShowSearchResults(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Advocate';
  const displayRole = profile?.role || 'Advocate';

  const handleSignOut = async () => {
    setShowProfile(false);
    await logout();
    toast('Signed out successfully', 'info');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-menu-btn" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div className="header-breadcrumb">
          <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>Counsel</span>
          <span className="header-breadcrumb-sep">/</span>
          <span>{pageTitle}</span>
        </div>
      </div>

      <div className="header-right">
        <span className="header-date">{today}</span>

        {/* Global Instant Search */}
        <div ref={searchRef} className="header-search">
          <Search />
          <input
            type="text"
            placeholder="Search cases, clients..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => {
              if (searchValue.trim()) setShowSearchResults(true);
            }}
          />

          <AnimatePresence>
            {showSearchResults && searchValue.trim().length > 0 && (
              <motion.div
                className="header-search-results"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {hasSearchResults ? (
                  <>
                    {matchedCases.length > 0 && (
                      <div className="header-search-group">
                        <div className="header-search-group-title">Matters</div>
                        {matchedCases.map((c) => (
                          <button
                            key={c.id}
                            className="header-search-item"
                            onClick={() => handleSelectCase(c)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                              <div style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Briefcase size={14} style={{ color: 'var(--brass-muted)' }} />
                              </div>
                              <div style={{ minWidth: 0, overflow: 'hidden', flex: 1 }}>
                                <div style={{ fontWeight: 500 }} className="truncate">{c.title}</div>
                                <div className="text-caption truncate">{c.case_number || c.id} · {c.client}</div>
                              </div>
                            </div>
                            <ChevronRight size={13} style={{ color: 'var(--stone-light)', flexShrink: 0, marginLeft: '6px' }} />
                          </button>
                        ))}
                      </div>
                    )}

                    {matchedClients.length > 0 && (
                      <div className="header-search-group">
                        <div className="header-search-group-title">Clients</div>
                        {matchedClients.map((cl) => (
                          <button
                            key={cl.id}
                            className="header-search-item"
                            onClick={() => handleSelectClient(cl)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                              <div style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Users size={14} style={{ color: 'var(--stone)' }} />
                              </div>
                              <div style={{ minWidth: 0, overflow: 'hidden', flex: 1 }}>
                                <div style={{ fontWeight: 500 }} className="truncate">{cl.name || cl.full_name}</div>
                                <div className="text-caption truncate">{cl.client_code || cl.id} · {cl.type || cl.client_type}</div>
                              </div>
                            </div>
                            <ChevronRight size={13} style={{ color: 'var(--stone-light)', flexShrink: 0, marginLeft: '6px' }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="header-search-empty">
                    No matters or clients match &ldquo;{searchValue}&rdquo;
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            className="header-icon-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
              setShowSearchResults(false);
            }}
            title="View notifications"
          >
            <Bell />
            {unreadCount > 0 && <span className="badge" />}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                className="notifications-dropdown"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <div className="notifications-header">
                  <span>Notifications</span>
                  {unreadCount > 0 ? (
                    <button
                      className="text-caption"
                      style={{ color: 'var(--brass)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
                      onClick={handleMarkAllRead}
                    >
                      Mark all read
                    </button>
                  ) : (
                    <span className="text-caption" style={{ color: 'var(--stone)' }}>
                      All caught up
                    </span>
                  )}
                </div>
                {notificationList.length > 0 ? (
                  notificationList.map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${n.unread ? 'notification-unread' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                      title="Click to view related section"
                    >
                      <div className="notification-title">{n.title}</div>
                      <div className="text-caption">{n.text}</div>
                      <div className="notification-time">{n.time}</div>
                    </div>
                  ))
                ) : (
                  <div className="notification-item">
                    <div className="text-caption">No active alerts or upcoming hearings today.</div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            className="header-icon-btn"
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
              setShowSearchResults(false);
            }}
            title="User menu"
          >
            <User />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                className="profile-dropdown"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '4px',
                  }}
                >
                  <div style={{ fontSize: '0.857rem', fontWeight: 600 }}>{displayName}</div>
                  <div className="text-caption">{displayRole}</div>
                </div>
                <button
                  className="profile-dropdown-item"
                  onClick={() => {
                    setShowProfile(false);
                    navigate('/settings');
                  }}
                >
                  <User /> Profile
                </button>
                <button
                  className="profile-dropdown-item"
                  onClick={() => {
                    setShowProfile(false);
                    navigate('/settings');
                  }}
                >
                  <Settings /> Settings
                </button>
                <button
                  className="profile-dropdown-item"
                  style={{ color: 'var(--terracotta)' }}
                  onClick={handleSignOut}
                >
                  <LogOut /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
