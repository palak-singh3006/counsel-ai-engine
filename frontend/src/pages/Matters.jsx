import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Briefcase,
  FileText,
  Calendar,
  CreditCard,
  Scale,
  Building2,
  User,
  Clock,
  Brain,
} from 'lucide-react';
import {
  cases as initialCases,
  clients,
  documents,
  payments,
  hearings,
} from '../data/mockData';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

const STATUS_OPTIONS = ['All', 'Active', 'Pending', 'Closed'];

const CASE_TYPE_OPTIONS = [
  'All',
  'Civil',
  'Criminal',
  'Tax',
  'Labour',
  'Commercial',
  'Environmental',
  'IP',
  'Motor Accident',
  'Family',
];

const ADD_CASE_TYPES = CASE_TYPE_OPTIONS.filter((t) => t !== 'All');

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getNextCaseNumber(casesList) {
  const numbers = casesList
    .map((c) => {
      const match = String(c.id).match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !Number.isNaN(n));
  const nextNum = (numbers.length ? Math.max(...numbers) : casesList.length) + 1;
  return `CS/2024/${String(nextNum).padStart(3, '0')}`;
}

function getStatusBadgeClass(status) {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'status-badge status-active';
    case 'pending':
      return 'status-badge status-pending';
    case 'closed':
      return 'status-badge status-closed';
    default:
      return 'status-badge status-draft';
  }
}

function matchesCaseType(caseType, filterType) {
  if (filterType === 'All') return true;
  if (!caseType) return false;
  if (filterType === 'IP') return caseType === 'IP';
  return (
    caseType.toLowerCase() === filterType.toLowerCase() ||
    caseType.toLowerCase().startsWith(filterType.toLowerCase())
  );
}

export default function Matters() {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [casesList, setCasesList] = useState(initialCases);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [selectedCase, setSelectedCase] = useState(() => {
    const id = location.state?.selectedCaseId;
    return id ? initialCases.find((c) => c.id === id) || null : null;
  });
  const [prevNavKey, setPrevNavKey] = useState(location.key);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (location.key !== prevNavKey) {
    setPrevNavKey(location.key);
    if (location.state?.selectedCaseId) {
      const found = casesList.find((c) => c.id === location.state.selectedCaseId);
      if (found) {
        setSelectedCase(found);
      }
    }
  }

  const [formData, setFormData] = useState({
    id: getNextCaseNumber(initialCases),
    title: '',
    clientId: '',
    court: '',
    caseType: 'Civil',
    filingDate: new Date().toISOString().split('T')[0],
    status: 'active',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const counts = useMemo(() => {
    const total = casesList.length;
    const active = casesList.filter((c) => c.status === 'active').length;
    const pending = casesList.filter((c) => c.status === 'pending').length;
    const closed = casesList.filter((c) => c.status === 'closed').length;
    return { total, active, pending, closed };
  }, [casesList]);

  const filteredCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return casesList.filter((c) => {
      const matchesSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.client.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'All' || c.status === statusFilter.toLowerCase();

      const matchesType = matchesCaseType(c.caseType, typeFilter);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [casesList, searchQuery, statusFilter, typeFilter]);

  const caseDocuments = useMemo(() => {
    if (!selectedCase) return [];
    return documents.filter((d) => d.caseId === selectedCase.id);
  }, [selectedCase]);

  const casePayments = useMemo(() => {
    if (!selectedCase) return [];
    return payments.filter((p) => p.caseId === selectedCase.id);
  }, [selectedCase]);

  const caseHearings = useMemo(() => {
    if (!selectedCase) return [];
    return hearings.filter((h) => h.caseId === selectedCase.id);
  }, [selectedCase]);

  const openAddModal = () => {
    setFormData({
      id: getNextCaseNumber(casesList),
      title: '',
      clientId: '',
      court: '',
      caseType: 'Civil',
      filingDate: new Date().toISOString().split('T')[0],
      status: 'active',
      description: '',
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Matter title is required.';
    }
    if (!formData.clientId) {
      errors.clientId = 'Please select a client.';
    }
    if (!formData.court.trim()) {
      errors.court = 'Court or forum name is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMatter = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const clientObj = clients.find((cl) => cl.id === formData.clientId);
    const caseNumber = formData.id.trim() || getNextCaseNumber(casesList);

    const newMatter = {
      id: caseNumber,
      title: formData.title.trim(),
      client: clientObj ? clientObj.name : '',
      clientId: formData.clientId,
      court: formData.court.trim(),
      caseType: formData.caseType,
      filingDate: formData.filingDate || new Date().toISOString().split('T')[0],
      status: formData.status,
      nextHearing: null,
      description:
        formData.description.trim() ||
        `${formData.caseType} matter filed before ${formData.court.trim()}.`,
    };

    setCasesList((prev) => [newMatter, ...prev]);
    setIsAddModalOpen(false);
    toast(`Matter ${newMatter.id} registered successfully.`, 'success');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setTypeFilter('All');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || statusFilter !== 'All' || typeFilter !== 'All';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Matters</h1>
          <p className="page-subtitle">
            {counts.total} total · {counts.active} active · {counts.pending} pending ·{' '}
            {counts.closed} closed
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            <Plus size={15} />
            New Matter
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input" style={{ maxWidth: '340px', width: '100%' }}>
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by case no., title, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search matters"
            />
          </div>
        </div>

        <div className="toolbar-right">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === 'All' ? 'Status: All' : status}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by case type"
          >
            {CASE_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type === 'All' ? 'Type: All' : type}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={clearFilters}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Case Table */}
      <div className="card">
        {filteredCases.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case No</th>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Court</th>
                  <th>Type</th>
                  <th>Filing Date</th>
                  <th>Status</th>
                  <th>Next Hearing</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((matter) => (
                  <tr
                    key={matter.id}
                    onClick={() => setSelectedCase(matter)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td
                      style={{
                        fontWeight: 600,
                        color: 'var(--midnight)',
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {matter.id}
                    </td>
                    <td style={{ maxWidth: '220px' }}>
                      <div
                        className="truncate"
                        title={matter.title}
                        style={{ fontWeight: 500 }}
                      >
                        {matter.title}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {matter.client}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {matter.court}
                    </td>
                    <td>
                      <span
                        className="text-small"
                        style={{
                          padding: '2px 8px',
                          background: 'var(--paper-warm)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {matter.caseType}
                      </span>
                    </td>
                    <td
                      style={{
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatDate(matter.filingDate)}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(matter.status)}>
                        {matter.status}
                      </span>
                    </td>
                    <td
                      style={{
                        color:
                          matter.status === 'closed' || !matter.nextHearing
                            ? 'var(--text-tertiary)'
                            : 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {matter.status === 'closed' ? '—' : formatDate(matter.nextHearing)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Briefcase />
            <h3>No matching matters</h3>
            <p>
              No matters match your current search or filter criteria. Try adjusting or
              resetting your filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary btn-sm mt-4"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Case Detail Modal */}
      <Modal
        isOpen={Boolean(selectedCase)}
        onClose={() => setSelectedCase(null)}
        title={selectedCase ? `${selectedCase.id} — Matter Brief` : 'Matter Brief'}
        wide
      >
        {selectedCase && (
          <>
            <div className="modal-body">
              {/* Header Overview */}
              <div
                style={{
                  paddingBottom: 'var(--space-5)',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: 'var(--space-5)',
                }}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span
                    className="text-label"
                    style={{ color: 'var(--brass-muted)', letterSpacing: '0.1em' }}
                  >
                    {selectedCase.id} · {selectedCase.caseType}
                  </span>
                  <span className={getStatusBadgeClass(selectedCase.status)}>
                    {selectedCase.status}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.35rem',
                    fontWeight: 400,
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  {selectedCase.title}
                </h3>
                <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
                  {selectedCase.description || 'No description recorded.'}
                </p>
              </div>

              {/* Metadata Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-4)',
                  background: 'var(--paper-warm)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-6)',
                }}
              >
                <div>
                  <div className="text-label flex items-center gap-1 mb-1">
                    <User size={12} /> Client
                  </div>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: '0.929rem',
                      color: 'var(--brass-muted)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                    }}
                    onClick={() => {
                      const cId = selectedCase.clientId;
                      setSelectedCase(null);
                      navigate('/clients', { state: { selectedClientId: cId } });
                    }}
                    title="Click to view client dossier"
                  >
                    {selectedCase.client} &rarr;
                  </div>
                </div>
                <div>
                  <div className="text-label flex items-center gap-1 mb-1">
                    <Building2 size={12} /> Court / Forum
                  </div>
                  <div style={{ fontWeight: 500, fontSize: '0.929rem' }}>
                    {selectedCase.court}
                  </div>
                </div>
                <div>
                  <div className="text-label flex items-center gap-1 mb-1">
                    <Scale size={12} /> Case Type
                  </div>
                  <div style={{ fontWeight: 500, fontSize: '0.929rem' }}>
                    {selectedCase.caseType}
                  </div>
                </div>
                <div>
                  <div className="text-label flex items-center gap-1 mb-1">
                    <Calendar size={12} /> Filing Date
                  </div>
                  <div style={{ fontWeight: 500, fontSize: '0.929rem' }}>
                    {formatDate(selectedCase.filingDate)}
                  </div>
                </div>
                <div>
                  <div className="text-label flex items-center gap-1 mb-1">
                    <Clock size={12} /> Next Hearing
                  </div>
                  <div style={{ fontWeight: 500, fontSize: '0.929rem' }}>
                    {selectedCase.status === 'closed'
                      ? '—'
                      : formatDate(selectedCase.nextHearing)}
                  </div>
                </div>
              </div>

              {/* Upcoming Hearings */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="heading-3 flex items-center gap-2">
                    <Calendar size={14} style={{ color: 'var(--brass-muted)' }} />
                    Upcoming Hearings
                  </h4>
                  <span className="text-caption">{caseHearings.length} scheduled</span>
                </div>
                {caseHearings.length > 0 ? (
                  <div
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                    }}
                  >
                    {caseHearings.map((hearing, idx) => (
                      <div
                        key={hearing.id}
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          borderBottom:
                            idx < caseHearings.length - 1
                              ? '1px solid var(--border-subtle)'
                              : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 'var(--space-4)',
                          background: 'white',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.857rem' }}>
                            {hearing.type} · {formatDate(hearing.date)} at {hearing.time}
                          </div>
                          {hearing.notes && (
                            <div className="text-small mt-1">{hearing.notes}</div>
                          )}
                        </div>
                        <span
                          className={
                            hearing.status === 'today'
                              ? 'status-badge status-urgent'
                              : 'status-badge status-pending'
                          }
                        >
                          {hearing.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-small"
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--stone-bg)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    No upcoming hearings scheduled for this matter.
                  </div>
                )}
              </div>

              {/* Associated Documents */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="heading-3 flex items-center gap-2">
                    <FileText size={14} style={{ color: 'var(--brass-muted)' }} />
                    Associated Documents
                  </h4>
                  <span className="text-caption">{caseDocuments.length} files</span>
                </div>
                {caseDocuments.length > 0 ? (
                  <div
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                    }}
                  >
                    {caseDocuments.map((doc, idx) => (
                      <div
                        key={doc.id}
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          borderBottom:
                            idx < caseDocuments.length - 1
                              ? '1px solid var(--border-subtle)'
                              : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 'var(--space-4)',
                          background: 'white',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.857rem' }}>
                            {doc.name}
                          </div>
                          <div className="text-caption">
                            {doc.category} · Uploaded {formatDate(doc.uploadDate)}
                          </div>
                        </div>
                        <span
                          className="text-caption"
                          style={{
                            padding: '2px 8px',
                            background: 'var(--stone-bg)',
                            borderRadius: 'var(--radius-sm)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {doc.type} · {doc.size}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-small"
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--stone-bg)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    No documents uploaded for this matter yet.
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="heading-3 flex items-center gap-2">
                    <CreditCard size={14} style={{ color: 'var(--brass-muted)' }} />
                    Payment History
                  </h4>
                  <span className="text-caption">{casePayments.length} entries</span>
                </div>
                {casePayments.length > 0 ? (
                  <div
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                    }}
                  >
                    {casePayments.map((payment, idx) => (
                      <div
                        key={payment.id}
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          borderBottom:
                            idx < casePayments.length - 1
                              ? '1px solid var(--border-subtle)'
                              : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 'var(--space-4)',
                          background: 'white',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.857rem' }}>
                            {payment.description}
                          </div>
                          <div className="text-caption">
                            {formatDate(payment.date)} · {payment.mode}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            style={{
                              fontWeight: 600,
                              fontVariantNumeric: 'tabular-nums',
                              fontSize: '0.929rem',
                            }}
                          >
                            {formatINR(payment.amount)}
                          </span>
                          <span
                            className={
                              payment.status === 'received'
                                ? 'status-badge status-active'
                                : 'status-badge status-urgent'
                            }
                          >
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-small"
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--stone-bg)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    No fee entries recorded for this matter.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const caseId = selectedCase.id;
                  setSelectedCase(null);
                  navigate('/ai-intelligence', { state: { selectedCaseId: caseId } });
                }}
                title="Send matter to AI Intelligence Workbench"
              >
                <Brain size={14} /> Analyze in AI Workbench
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedCase(null)}
              >
                Close
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Add Matter Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Matter"
      >
        <form onSubmit={handleAddMatter} noValidate>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="matter-case-no">
                  Case Number
                </label>
                <input
                  id="matter-case-no"
                  type="text"
                  className="form-input"
                  value={formData.id}
                  onChange={(e) => handleFieldChange('id', e.target.value)}
                  placeholder="CS/2024/013"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="matter-filing-date">
                  Filing Date
                </label>
                <input
                  id="matter-filing-date"
                  type="date"
                  className="form-input"
                  value={formData.filingDate}
                  onChange={(e) => handleFieldChange('filingDate', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="matter-title">
                Matter Title *
              </label>
              <input
                id="matter-title"
                type="text"
                className={`form-input ${formErrors.title ? 'error' : ''}`}
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="e.g. Kapoor vs. State of UP"
              />
              {formErrors.title && <div className="form-error">{formErrors.title}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="matter-client">
                  Client *
                </label>
                <select
                  id="matter-client"
                  className={`form-input ${formErrors.clientId ? 'error' : ''}`}
                  value={formData.clientId}
                  onChange={(e) => handleFieldChange('clientId', e.target.value)}
                >
                  <option value="">Select client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {formErrors.clientId && (
                  <div className="form-error">{formErrors.clientId}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="matter-type">
                  Case Type
                </label>
                <select
                  id="matter-type"
                  className="form-input"
                  value={formData.caseType}
                  onChange={(e) => handleFieldChange('caseType', e.target.value)}
                >
                  {ADD_CASE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="matter-court">
                  Court / Forum *
                </label>
                <input
                  id="matter-court"
                  type="text"
                  className={`form-input ${formErrors.court ? 'error' : ''}`}
                  value={formData.court}
                  onChange={(e) => handleFieldChange('court', e.target.value)}
                  placeholder="e.g. High Court, Lucknow"
                />
                {formErrors.court && <div className="form-error">{formErrors.court}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="matter-status">
                  Status
                </label>
                <select
                  id="matter-status"
                  className="form-input"
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="matter-description">
                Description
              </label>
              <textarea
                id="matter-description"
                className="form-textarea"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Brief summary of facts, statutory provisions, and relief sought..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={15} />
              Register Matter
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
