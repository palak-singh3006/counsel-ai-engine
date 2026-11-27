import { useState, useMemo, useEffect, useCallback } from 'react';
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
  Trash2,
} from 'lucide-react';
import { caseService, clientService, extractErrorMessage } from '../services/api';
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

function getStatusBadgeClass(status) {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'status-badge status-active';
    case 'pending':
      return 'status-badge status-pending';
    case 'closed':
    case 'disposed':
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

  const [casesList, setCasesList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetail, setCaseDetail] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    case_number: '',
    title: '',
    clientId: '',
    court: '',
    caseType: 'Civil',
    filingDate: new Date().toISOString().split('T')[0],
    status: 'active',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchCasesAndClients = useCallback(async () => {
    setLoading(true);
    try {
      const [casesRes, clientsRes] = await Promise.all([
        caseService.getAll(),
        clientService.getAll(),
      ]);
      setCasesList(casesRes.data?.data || []);
      setClientsList(clientsRes.data?.data || []);
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to load matters'), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    Promise.all([caseService.getAll(), clientService.getAll()])
      .then(([casesRes, clientsRes]) => {
        if (!active) return;
        setCasesList(casesRes.data?.data || []);
        setClientsList(clientsRes.data?.data || []);
      })
      .catch((err) => {
        if (active) toast(extractErrorMessage(err, 'Failed to load matters'), 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const openCaseDetail = useCallback(
    async (matter) => {
      setSelectedCase(matter);
      setCaseDetail(null);
      try {
        const res = await caseService.getById(matter.id);
        setCaseDetail(res.data?.data || null);
      } catch (err) {
        toast(extractErrorMessage(err, 'Failed to load matter dossier'), 'error');
      }
    },
    [toast]
  );

  useEffect(() => {
    const incomingId = location.state?.selectedCaseId;
    if (!incomingId || casesList.length === 0) return;
    const found = casesList.find((c) => c.id === incomingId || c.case_number === incomingId);
    if (!found) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) openCaseDetail(found);
    });
    return () => {
      active = false;
    };
  }, [location.state, casesList, openCaseDetail]);

  const counts = useMemo(() => {
    const total = casesList.length;
    const active = casesList.filter((c) => c.status === 'active').length;
    const pending = casesList.filter((c) => c.status === 'pending').length;
    const closed = casesList.filter((c) => c.status === 'closed' || c.status === 'disposed').length;
    return { total, active, pending, closed };
  }, [casesList]);

  const filteredCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return casesList.filter((c) => {
      const matchesSearch =
        !q ||
        (c.case_number || '').toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.client || '').toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'All' || c.status === statusFilter.toLowerCase();

      const matchesType = matchesCaseType(c.caseType || c.case_type, typeFilter);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [casesList, searchQuery, statusFilter, typeFilter]);

  const openAddModal = () => {
    const nextNo = `CS/${new Date().getFullYear()}/${String(casesList.length + 1).padStart(3, '0')}`;
    setFormData({
      case_number: nextNo,
      title: '',
      clientId: clientsList[0]?.id || '',
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
    if (!formData.title.trim()) errors.title = 'Matter title is required.';
    if (!formData.clientId) errors.clientId = 'Please select a client.';
    if (!formData.court.trim()) errors.court = 'Court or forum name is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMatter = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const res = await caseService.create({
        case_number: formData.case_number.trim() || undefined,
        title: formData.title.trim(),
        client_id: formData.clientId,
        court_name: formData.court.trim(),
        case_type: formData.caseType,
        filing_date: formData.filingDate,
        status: formData.status,
        description: formData.description.trim(),
      });
      const created = res.data?.data;
      setIsAddModalOpen(false);
      toast(`Matter ${created?.case_number || ''} registered successfully.`, 'success');
      await fetchCasesAndClients();
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to register matter'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (matter, newStatus) => {
    try {
      await caseService.update(matter.id, { status: newStatus });
      toast(`Matter status updated to ${newStatus}`, 'success');
      await fetchCasesAndClients();
      openCaseDetail({ ...matter, status: newStatus });
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to update status'), 'error');
    }
  };

  const handleDeleteMatter = async (matter) => {
    try {
      await caseService.delete(matter.id);
      toast(`Matter "${matter.title}" deleted`, 'info');
      setSelectedCase(null);
      setCaseDetail(null);
      await fetchCasesAndClients();
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to delete matter'), 'error');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setTypeFilter('All');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || statusFilter !== 'All' || typeFilter !== 'All';

  const caseHearings = caseDetail?.hearings || [];
  const caseDocuments = caseDetail?.documents || [];
  const casePayments = caseDetail?.payments || [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Matters</h1>
          <p className="page-subtitle">
            {counts.total} total · {counts.active} active · {counts.pending} pending · {counts.closed} closed
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            <Plus size={15} /> New Matter
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input" style={{ maxWidth: '340px', width: '100%' }}>
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by case no., title, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === 'All' ? 'Status: All' : status}
              </option>
            ))}
          </select>
          <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {CASE_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type === 'All' ? 'Type: All' : type}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading matters...
          </div>
        ) : filteredCases.length > 0 ? (
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
                  <tr key={matter.id} onClick={() => openCaseDetail(matter)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600, color: 'var(--midnight)', whiteSpace: 'nowrap' }}>
                      {matter.case_number}
                    </td>
                    <td style={{ maxWidth: '220px' }}>
                      <div className="truncate" title={matter.title} style={{ fontWeight: 500 }}>
                        {matter.title}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{matter.client}</td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{matter.court_name}</td>
                    <td>
                      <span
                        className="text-small"
                        style={{
                          padding: '2px 8px',
                          background: 'var(--paper-warm)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {matter.case_type}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDate(matter.filing_date)}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(matter.status)}>{matter.status}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {matter.status === 'closed' ? '—' : formatDate(matter.next_hearing_date)}
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
            <p>Adjust your search filters or register a new legal matter.</p>
          </div>
        )}
      </div>

      {/* Case Detail Modal */}
      <Modal
        isOpen={Boolean(selectedCase)}
        onClose={() => { setSelectedCase(null); setCaseDetail(null); }}
        title={selectedCase ? `${selectedCase.case_number} — Matter Brief` : 'Matter Brief'}
        wide
      >
        {selectedCase && (
          <>
            <div className="modal-body">
              <div style={{ paddingBottom: 'var(--space-5)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 'var(--space-5)' }}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-label" style={{ color: 'var(--brass-muted)', letterSpacing: '0.1em' }}>
                    {selectedCase.case_number} · {selectedCase.case_type}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      className="filter-select"
                      style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                      value={selectedCase.status}
                      onChange={(e) => handleStatusChange(selectedCase, e.target.value)}
                    >
                      <option value="active">active</option>
                      <option value="pending">pending</option>
                      <option value="closed">closed</option>
                    </select>
                    <span className={getStatusBadgeClass(selectedCase.status)}>{selectedCase.status}</span>
                  </div>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 400, marginBottom: 'var(--space-2)' }}>
                  {selectedCase.title}
                </h3>
                <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
                  {selectedCase.description || 'No description recorded.'}
                </p>
              </div>

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
                  <div className="text-label flex items-center gap-1 mb-1"><User size={12} /> Client</div>
                  <div
                    style={{ fontWeight: 500, fontSize: '0.929rem', color: 'var(--brass-muted)', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => {
                      const cId = selectedCase.client_id;
                      setSelectedCase(null);
                      navigate('/clients', { state: { selectedClientId: cId } });
                    }}
                  >
                    {selectedCase.client} &rarr;
                  </div>
                </div>
                <div>
                  <div className="text-label flex items-center gap-1 mb-1"><Building2 size={12} /> Court / Forum</div>
                  <div style={{ fontWeight: 500, fontSize: '0.929rem' }}>{selectedCase.court_name}</div>
                </div>
                <div>
                  <div className="text-label flex items-center gap-1 mb-1"><Scale size={12} /> Case Type</div>
                  <div style={{ fontWeight: 500, fontSize: '0.929rem' }}>{selectedCase.case_type}</div>
                </div>
                <div>
                  <div className="text-label flex items-center gap-1 mb-1"><Calendar size={12} /> Filing Date</div>
                  <div style={{ fontWeight: 500, fontSize: '0.929rem' }}>{formatDate(selectedCase.filing_date)}</div>
                </div>
                <div>
                  <div className="text-label flex items-center gap-1 mb-1"><Clock size={12} /> Next Hearing</div>
                  <div style={{ fontWeight: 500, fontSize: '0.929rem' }}>
                    {selectedCase.status === 'closed' ? '—' : formatDate(selectedCase.next_hearing_date)}
                  </div>
                </div>
              </div>

              {/* Upcoming Hearings */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="heading-3 flex items-center gap-2">
                    <Calendar size={14} style={{ color: 'var(--brass-muted)' }} /> Hearings
                  </h4>
                  <span className="text-caption">{caseHearings.length} scheduled</span>
                </div>
                {caseHearings.length > 0 ? (
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {caseHearings.map((h, idx) => (
                      <div key={h.id} style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: idx < caseHearings.length - 1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', justifyContent: 'space-between', background: 'white' }}>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.857rem' }}>
                            {h.hearing_type || 'Hearing'} · {formatDate(h.hearing_date)} at {h.hearing_time || '10:30'}
                          </div>
                          {h.notes && <div className="text-small mt-1">{h.notes}</div>}
                        </div>
                        <span className="status-badge status-pending">{h.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-small" style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--stone-bg)', borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)' }}>
                    No hearings scheduled for this matter.
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="heading-3 flex items-center gap-2">
                    <FileText size={14} style={{ color: 'var(--brass-muted)' }} /> Associated Documents
                  </h4>
                  <span className="text-caption">{caseDocuments.length} files</span>
                </div>
                {caseDocuments.length > 0 ? (
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {caseDocuments.map((doc, idx) => (
                      <div key={doc.id} style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: idx < caseDocuments.length - 1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.857rem' }}>{doc.document_name}</div>
                          <div className="text-caption">{doc.category} · Uploaded {formatDate(doc.upload_date)}</div>
                        </div>
                        <span className="text-caption" style={{ padding: '2px 8px', background: 'var(--stone-bg)', borderRadius: 'var(--radius-sm)' }}>
                          {doc.document_type}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-small" style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--stone-bg)', borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)' }}>
                    No documents uploaded for this matter yet.
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="heading-3 flex items-center gap-2">
                    <CreditCard size={14} style={{ color: 'var(--brass-muted)' }} /> Payment History
                  </h4>
                  <span className="text-caption">{casePayments.length} entries</span>
                </div>
                {casePayments.length > 0 ? (
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {casePayments.map((p, idx) => (
                      <div key={p.id} style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: idx < casePayments.length - 1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.857rem' }}>{p.notes || 'Legal Fee'}</div>
                          <div className="text-caption">{formatDate(p.payment_date)} · {p.payment_method}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span style={{ fontWeight: 600, fontSize: '0.929rem' }}>
                            {formatINR(p.amount_paid)} / {formatINR(p.total_fee)}
                          </span>
                          <span className={p.status === 'paid' ? 'status-badge status-active' : 'status-badge status-urgent'}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-small" style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--stone-bg)', borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)' }}>
                    No fee entries recorded for this matter.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const caseId = selectedCase.id;
                    setSelectedCase(null);
                    navigate('/ai-intelligence', { state: { selectedCaseId: caseId } });
                  }}
                >
                  <Brain size={14} /> Analyze in AI Workbench
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--terracotta)' }}
                  onClick={() => handleDeleteMatter(selectedCase)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedCase(null)}>
                Close
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* New Matter Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Legal Matter">
        <form onSubmit={handleAddMatter}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Case Number</label>
                <input
                  className="form-input"
                  value={formData.case_number}
                  onChange={(e) => handleFieldChange('case_number', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Filing Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.filingDate}
                  onChange={(e) => handleFieldChange('filingDate', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Matter Title *</label>
              <input
                className={`form-input ${formErrors.title ? 'error' : ''}`}
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="e.g. Verma vs. State of UP"
              />
              {formErrors.title && <div className="form-error">{formErrors.title}</div>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Client *</label>
                <select
                  className={`form-input ${formErrors.clientId ? 'error' : ''}`}
                  value={formData.clientId}
                  onChange={(e) => handleFieldChange('clientId', e.target.value)}
                >
                  <option value="">Select client...</option>
                  {clientsList.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.name || cl.full_name}
                    </option>
                  ))}
                </select>
                {formErrors.clientId && <div className="form-error">{formErrors.clientId}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Case Type</label>
                <select
                  className="form-input"
                  value={formData.caseType}
                  onChange={(e) => handleFieldChange('caseType', e.target.value)}
                >
                  {ADD_CASE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Court / Forum *</label>
                <input
                  className={`form-input ${formErrors.court ? 'error' : ''}`}
                  value={formData.court}
                  onChange={(e) => handleFieldChange('court', e.target.value)}
                  placeholder="e.g. High Court, Lucknow"
                />
                {formErrors.court && <div className="form-error">{formErrors.court}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select
                  className="form-input"
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Brief Description</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Summary of legal brief and relief sought..."
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Registering...' : 'Register Matter'}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
