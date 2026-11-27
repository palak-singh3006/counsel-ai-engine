import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Calendar,
  FileText,
  Banknote,
  UserPlus,
  Briefcase,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  cases,
  clients,
  hearings,
  payments,
  activities,
  caseDistribution,
} from '../data/mockData';

const activityIcons = {
  calendar: Calendar,
  file: FileText,
  banknote: Banknote,
  'user-plus': UserPlus,
  briefcase: Briefcase,
};

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const navigate = useNavigate();
  const [caseSearch, setCaseSearch] = useState('');
  const [caseTypeFilter, setCaseTypeFilter] = useState('All');

  const todaysHearings = hearings.filter((h) => h.status === 'today');
  const upcomingHearings = hearings.filter((h) => h.status === 'upcoming').slice(0, 4);
  const activeCases = cases.filter((c) => c.status === 'active');
  const outstandingPayments = payments.filter((p) => p.status === 'outstanding');
  const totalOutstanding = outstandingPayments.reduce((s, p) => s + p.amount, 0);

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const caseTypes = ['All', ...new Set(cases.map((c) => c.caseType))];

  const filteredCases = cases
    .filter((c) => {
      if (caseTypeFilter !== 'All' && c.caseType !== caseTypeFilter) return false;
      if (caseSearch) {
        const q = caseSearch.toLowerCase();
        return (
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.client.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .slice(0, 7);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Greeting */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '4px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'var(--text-primary)' }}>
            {greeting}, Advocate.
          </h1>
        </div>
        <p style={{ fontSize: '0.929rem', color: 'var(--text-tertiary)' }}>
          Here is the state of your practice today.
        </p>
        <div
          style={{
            marginTop: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.786rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--brass)',
          }}
        >
          <span
            style={{
              width: '20px',
              height: '2px',
              background: 'var(--brass)',
              display: 'inline-block',
            }}
          />
          {dateStr}
        </div>
      </div>

      {/* Key Metrics — deliberately varied */}
      <div className="dashboard-metrics-grid">
        {/* Total Clients */}
        <div
          className="card"
          style={{ padding: 'var(--space-5) var(--space-6)', cursor: 'pointer' }}
          onClick={() => navigate('/clients')}
          title="View all clients"
        >
          <div className="text-label" style={{ marginBottom: '4px' }}>Total Clients</div>
          <div style={{ fontSize: '2rem', fontWeight: 300, fontFamily: 'var(--font-serif)' }}>
            {clients.length}
          </div>
          <div className="text-caption" style={{ marginTop: '4px' }}>
            {clients.filter((c) => c.status === 'active').length} active
          </div>
        </div>

        {/* Active Matters */}
        <div
          className="card"
          style={{ padding: 'var(--space-5) var(--space-6)', cursor: 'pointer' }}
          onClick={() => navigate('/matters')}
          title="View active matters"
        >
          <div className="text-label" style={{ marginBottom: '4px' }}>Active Matters</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 300, fontFamily: 'var(--font-serif)' }}>
              {activeCases.length}
            </span>
            <span
              style={{
                fontSize: '0.714rem',
                color: 'var(--sage-text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <TrendingUp size={12} /> +2 this month
            </span>
          </div>
          <div className="text-caption" style={{ marginTop: '4px' }}>
            {cases.filter((c) => c.status === 'pending').length} pending admission
          </div>
        </div>

        {/* Today's Hearings — prominent */}
        <div
          className="card"
          style={{
            padding: 'var(--space-5) var(--space-6)',
            borderLeft: '3px solid var(--brass)',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/hearings')}
          title="View hearing calendar"
        >
          <div className="text-label" style={{ marginBottom: '4px', color: 'var(--brass-muted)' }}>
            Today&rsquo;s Hearings
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 300, fontFamily: 'var(--font-serif)' }}>
            {todaysHearings.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            {todaysHearings.map((h) => (
              <div
                key={h.id}
                className="text-caption"
                style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}
              >
                {h.time} — {h.caseTitle.length > 25 ? h.caseTitle.slice(0, 25) + '...' : h.caseTitle}
              </div>
            ))}
          </div>
        </div>

        {/* Outstanding Fees — terracotta accent */}
        <div
          className="card"
          style={{
            padding: 'var(--space-5) var(--space-6)',
            background: 'var(--terracotta-bg)',
            borderColor: 'rgba(196,105,74,0.15)',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/financials')}
          title="View outstanding receivables"
        >
          <div className="text-label" style={{ marginBottom: '4px', color: 'var(--terracotta-text)' }}>
            Outstanding Fees
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 300,
              fontFamily: 'var(--font-serif)',
              color: 'var(--terracotta-text)',
            }}
          >
            {formatINR(totalOutstanding)}
          </div>
          <div className="text-caption" style={{ marginTop: '4px', color: 'var(--terracotta)' }}>
            {outstandingPayments.length} pending payments
          </div>
        </div>
      </div>

      {/* Attention + Hearing Agenda */}
      <div className="dashboard-two-col">
        {/* Priority / Attention */}
        <div
          className="card"
          style={{
            borderLeft: '3px solid var(--terracotta)',
          }}
        >
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} style={{ color: 'var(--terracotta)' }} />
              <span className="card-title">Needs Attention</span>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {/* Today's hearings */}
            {todaysHearings.map((h) => (
              <div
                key={h.id}
                style={{
                  padding: '12px 24px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)',
                }}
                onClick={() => navigate('/hearings')}
                title="View in Hearing Calendar"
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--brass)',
                    marginTop: '6px',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.857rem', fontWeight: 500 }}>{h.caseTitle}</div>
                  <div className="text-caption">{h.court} · {h.type} · {h.time}</div>
                </div>
                <span
                  className="status-badge"
                  style={{ background: 'var(--brass-bg)', color: 'var(--brass-muted)', fontSize: '0.643rem' }}
                >
                  Hearing Today
                </span>
              </div>
            ))}
            {/* Overdue payment */}
            <div
              style={{
                padding: '12px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onClick={() => navigate('/financials')}
              title="View in Financials"
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--terracotta)',
                  marginTop: '6px',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.857rem', fontWeight: 500 }}>Payment overdue — Rajesh Kumar Verma</div>
                <div className="text-caption">₹75,000 for December hearing fee</div>
              </div>
              <span className="status-badge status-overdue" style={{ fontSize: '0.643rem' }}>
                Overdue
              </span>
            </div>
            {/* Filing deadline */}
            <div
              style={{
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onClick={() => navigate('/matters')}
              title="View matter"
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--midnight)',
                  marginTop: '6px',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.857rem', fontWeight: 500 }}>Reply filing deadline</div>
                <div className="text-caption">
                  Bharat Construction Land Acquisition — reply due 5 Dec
                </div>
              </div>
              <span className="status-badge status-pending" style={{ fontSize: '0.643rem' }}>
                Deadline
              </span>
            </div>
          </div>
        </div>

        {/* Hearing Agenda */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Hearing Agenda</span>
            <span
              className="text-caption"
              style={{ cursor: 'pointer', color: 'var(--brass)' }}
              onClick={() => navigate('/hearings')}
            >
              {hearings.length} scheduled &rarr;
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {/* Today */}
            <div
              style={{
                padding: '8px 24px 4px',
                fontSize: '0.714rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--brass-muted)',
                background: 'var(--brass-bg)',
              }}
            >
              Today
            </div>
            {todaysHearings.map((h) => (
              <div
                key={h.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '56px 1fr auto',
                  padding: '10px 24px',
                  borderBottom: '1px solid var(--border-subtle)',
                  alignItems: 'center',
                  background: 'rgba(184, 150, 62, 0.03)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/hearings')}
                title="Open in Hearing Calendar"
              >
                <span style={{ fontSize: '0.857rem', fontWeight: 600, color: 'var(--brass-muted)' }}>
                  {h.time}
                </span>
                <div>
                  <div style={{ fontSize: '0.857rem', fontWeight: 500 }}>{h.caseTitle}</div>
                  <div className="text-caption">{h.client} · {h.court}</div>
                </div>
                <span className="status-badge status-pending" style={{ fontSize: '0.643rem' }}>
                  {h.type}
                </span>
              </div>
            ))}
            {/* Upcoming */}
            <div
              style={{
                padding: '8px 24px 4px',
                fontSize: '0.714rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-tertiary)',
              }}
            >
              Upcoming
            </div>
            {upcomingHearings.map((h) => (
              <div
                key={h.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr auto',
                  padding: '10px 24px',
                  borderBottom: '1px solid var(--border-subtle)',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/hearings')}
                title="Open in Hearing Calendar"
              >
                <span className="text-caption" style={{ fontWeight: 500 }}>
                  {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                <div>
                  <div style={{ fontSize: '0.857rem' }}>{h.caseTitle}</div>
                  <div className="text-caption">{h.court}</div>
                </div>
                <span className="text-caption">{h.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Case Overview Table */}
      <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="card-header">
          <span className="card-title">Case Overview</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="search-input" style={{ width: '200px' }}>
              <Search />
              <input
                type="text"
                placeholder="Search cases..."
                value={caseSearch}
                onChange={(e) => setCaseSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={caseTypeFilter}
              onChange={(e) => setCaseTypeFilter(e.target.value)}
            >
              {caseTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case No</th>
                <th>Title</th>
                <th>Client</th>
                <th>Court</th>
                <th>Type</th>
                <th>Status</th>
                <th>Next Hearing</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => (
                <tr
                  key={c.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/matters', { state: { selectedCaseId: c.id } })}
                  title="View matter details in Matters"
                >
                  <td style={{ fontFamily: 'var(--font-sans)', fontSize: '0.786rem', color: 'var(--text-tertiary)' }}>
                    {c.id}
                  </td>
                  <td style={{ fontWeight: 500, maxWidth: '200px' }} className="truncate">
                    {c.title}
                  </td>
                  <td>{c.client}</td>
                  <td className="text-small">{c.court}</td>
                  <td>
                    <span className="text-caption" style={{ fontWeight: 500 }}>{c.caseType}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${c.status}`}>{c.status}</span>
                  </td>
                  <td className="text-small">
                    {c.nextHearing
                      ? new Date(c.nextHearing).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart + Activity */}
      <div className="dashboard-chart-grid">
        {/* Case Distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Case Distribution</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={caseDistribution} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 12, fill: '#5a5d68' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1d2b',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#faf8f4',
                  }}
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={14}>
                  {caseDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {activities.slice(0, 8).map((a) => {
              const Icon = activityIcons[a.icon] || Briefcase;
              return (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 24px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'var(--stone-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.857rem' }}>{a.text}</div>
                    <div className="text-caption">{a.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
