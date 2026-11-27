import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Download
} from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { payments as initialPayments, cases } from '../data/mockData';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);

const paymentModes = ['All', 'Bank Transfer', 'UPI', 'Cheque', 'Cash', 'Pending'];
const paymentStatuses = ['All', 'received', 'outstanding'];

export default function Financials() {
  const toast = useToast();
  const navigate = useNavigate();

  const [paymentList, setPaymentList] = useState(initialPayments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const emptyForm = {
    caseId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    mode: 'Bank Transfer',
    status: 'received',
    description: '',
  };
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  // Summary calculations
  const totalBilled = useMemo(
    () => paymentList.reduce((acc, p) => acc + Number(p.amount), 0),
    [paymentList]
  );

  const totalCollected = useMemo(
    () =>
      paymentList
        .filter((p) => p.status === 'received')
        .reduce((acc, p) => acc + Number(p.amount), 0),
    [paymentList]
  );

  const totalOutstanding = useMemo(
    () =>
      paymentList
        .filter((p) => p.status === 'outstanding')
        .reduce((acc, p) => acc + Number(p.amount), 0),
    [paymentList]
  );

  // Case-wise financial breakdown
  const caseSummaries = useMemo(() => {
    const map = {};
    paymentList.forEach((p) => {
      if (!map[p.caseId]) {
        map[p.caseId] = {
          caseId: p.caseId,
          caseTitle: p.caseTitle,
          client: p.client,
          total: 0,
          collected: 0,
          outstanding: 0,
        };
      }
      const amt = Number(p.amount);
      map[p.caseId].total += amt;
      if (p.status === 'received') {
        map[p.caseId].collected += amt;
      } else {
        map[p.caseId].outstanding += amt;
      }
    });
    return Object.values(map).sort((a, b) => b.outstanding - a.outstanding);
  }, [paymentList]);

  // Filtered payments
  const filtered = useMemo(() => {
    return paymentList.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (modeFilter !== 'All' && item.mode !== modeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          item.caseTitle.toLowerCase().includes(q) ||
          item.client.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [paymentList, search, statusFilter, modeFilter]);

  const validateForm = () => {
    const errs = {};
    if (!formData.caseId) errs.caseId = 'Matter is required';
    if (!formData.amount || Number(formData.amount) <= 0) {
      errs.amount = 'Valid amount is required';
    }
    if (!formData.date) errs.date = 'Date is required';
    if (!formData.description.trim()) {
      errs.description = 'Billing milestone description is required';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const matchedCase = cases.find((c) => c.id === formData.caseId);

    const newPayment = {
      id: `PAY${String(paymentList.length + 1).padStart(3, '0')}`,
      caseId: formData.caseId,
      caseTitle: matchedCase ? matchedCase.title : 'General Matter',
      client: matchedCase ? matchedCase.client : 'Client',
      amount: Number(formData.amount),
      date: formData.date,
      mode: formData.status === 'outstanding' ? 'Pending' : formData.mode,
      status: formData.status,
      description: formData.description.trim(),
    };

    setPaymentList([newPayment, ...paymentList]);
    toast(`Recorded payment of ${formatINR(newPayment.amount)}`, 'success');
    closeModal();
  };

  const closeModal = () => {
    setShowAddModal(false);
    setFormData(emptyForm);
    setFormErrors({});
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Financials & Accounts</h1>
          <p className="page-subtitle">
            Fee ledgers, retainer recoveries, scheduled invoices, and matter billing records
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-secondary"
            onClick={() => toast('Exporting ledger to CSV statement...', 'info')}
          >
            <Download size={14} /> Export Ledger
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={15} /> Record Payment / Fee
          </button>
        </div>
      </div>

      {/* Varied Summary Metrics Grid */}
      <div className="financials-metrics-grid">
        {/* Total Billed */}
        <div
          className="card"
          style={{
            padding: 'var(--space-6)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div className="text-label" style={{ marginBottom: '6px' }}>Total Invoiced & Retainers</div>
          <div
            style={{
              fontSize: '2.2rem',
              fontWeight: 400,
              fontFamily: 'var(--font-serif)',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            {formatINR(totalBilled)}
          </div>
          <div
            className="text-caption"
            style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{ color: 'var(--stone)' }}>Across {paymentList.length} recorded line items</span>
          </div>
        </div>

        {/* Collected */}
        <div
          className="card"
          style={{
            padding: 'var(--space-6)',
            borderLeft: '4px solid var(--sage)',
            background: 'linear-gradient(180deg, #ffffff 0%, rgba(107, 143, 113, 0.04) 100%)',
          }}
        >
          <div className="text-label" style={{ marginBottom: '6px', color: 'var(--sage-text)' }}>
            Realized Collections
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 400,
              fontFamily: 'var(--font-serif)',
              color: 'var(--sage-text)',
            }}
          >
            {formatINR(totalCollected)}
          </div>
          <div className="text-caption" style={{ marginTop: '8px', color: 'var(--sage-text)' }}>
            {((totalCollected / (totalBilled || 1)) * 100).toFixed(1)}% recovery rate achieved
          </div>
        </div>

        {/* Outstanding */}
        <div
          className="card"
          style={{
            padding: 'var(--space-6)',
            borderLeft: '4px solid var(--terracotta)',
            background: 'var(--terracotta-bg)',
          }}
        >
          <div className="text-label" style={{ marginBottom: '6px', color: 'var(--terracotta-text)' }}>
            Pending Recoveries
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 400,
              fontFamily: 'var(--font-serif)',
              color: 'var(--terracotta-text)',
            }}
          >
            {formatINR(totalOutstanding)}
          </div>
          <div className="text-caption" style={{ marginTop: '8px', color: 'var(--terracotta-text)' }}>
            {paymentList.filter((p) => p.status === 'outstanding').length} matters with overdue balance
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input" style={{ width: '280px' }}>
            <Search />
            <input
              type="text"
              placeholder="Search matter, client, voucher ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {paymentStatuses.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Statuses' : s === 'received' ? 'Realized (Received)' : 'Outstanding (Pending)'}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
          >
            {paymentModes.map((m) => (
              <option key={m} value={m}>
                {m === 'All' ? 'All Payment Channels' : m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payment Transactions Table */}
      <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="card-header">
          <span className="card-title">Billing Ledger & Transactions</span>
          <span className="text-caption">{filtered.length} entries shown</span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Voucher / Ref</th>
                <th>Transaction Date</th>
                <th>Matter & Client</th>
                <th>Billing Milestone</th>
                <th>Channel / Mode</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Settlement Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="text-caption" style={{ fontWeight: 600 }}>{item.id}</td>
                  <td className="text-small">
                    {new Date(item.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/matters', { state: { selectedCaseId: item.caseId } })}
                    title="Click to view matter dossier"
                  >
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.caseTitle}</div>
                    <div className="text-caption" style={{ color: 'var(--brass-muted)' }}>
                      {item.client} · {item.caseId} &rarr;
                    </div>
                  </td>
                  <td className="text-small" style={{ color: 'var(--text-secondary)' }}>
                    {item.description}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        background: 'var(--stone-bg)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {item.mode}
                    </span>
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      fontFamily: 'var(--font-sans)',
                      color: item.status === 'received' ? 'var(--text-primary)' : 'var(--terracotta-text)',
                    }}
                  >
                    {formatINR(item.amount)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`status-badge status-${item.status}`}>
                      {item.status === 'received' ? 'Received' : 'Outstanding'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <h3>No financial vouchers found</h3>
                      <p>Adjust your search criteria or record a new transaction.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matter-Wise Financial Distribution Breakdown */}
      <div className="card">
        <div className="card-header">
          <div>
            <span className="card-title">Matter-Wise Accounts Reconciliation</span>
            <div className="text-caption" style={{ marginTop: '2px' }}>
              Fee realization and receivables grouped by active legal matters
            </div>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Matter Reference</th>
                <th>Client</th>
                <th style={{ textAlign: 'right' }}>Total Invoiced</th>
                <th style={{ textAlign: 'right' }}>Recovered</th>
                <th style={{ textAlign: 'right' }}>Pending Balance</th>
                <th>Collection Progress</th>
              </tr>
            </thead>
            <tbody>
              {caseSummaries.map((cs) => {
                const percent = Math.min(100, Math.round((cs.collected / (cs.total || 1)) * 100));
                return (
                  <tr
                    key={cs.caseId}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/matters', { state: { selectedCaseId: cs.caseId } })}
                    title="Click to view matter dossier"
                  >
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cs.caseTitle}</div>
                      <div className="text-caption" style={{ color: 'var(--brass-muted)' }}>{cs.caseId} &rarr;</div>
                    </td>
                    <td className="text-small">{cs.client}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatINR(cs.total)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--sage-text)', fontWeight: 500 }}>
                      {formatINR(cs.collected)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: cs.outstanding > 0 ? 'var(--terracotta-text)' : 'var(--text-tertiary)',
                      }}
                    >
                      {cs.outstanding > 0 ? formatINR(cs.outstanding) : '—'}
                    </td>
                    <td style={{ width: '160px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            background: 'var(--stone-border)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${percent}%`,
                              height: '100%',
                              background: percent === 100 ? 'var(--sage)' : 'var(--brass)',
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                        <span className="text-caption" style={{ width: '32px', textAlign: 'right' }}>
                          {percent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={showAddModal} onClose={closeModal} title="Record Fee / Voucher Transaction">
        <form onSubmit={handleRecordPayment}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Matter Association *</label>
              <select
                className={`form-input ${formErrors.caseId ? 'error' : ''}`}
                value={formData.caseId}
                onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
              >
                <option value="">Select Associated Matter...</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {c.client}
                  </option>
                ))}
              </select>
              {formErrors.caseId && <div className="form-error">{formErrors.caseId}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (INR ₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 75000"
                  className={`form-input ${formErrors.amount ? 'error' : ''}`}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
                {formErrors.amount && <div className="form-error">{formErrors.amount}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Date *</label>
                <input
                  type="date"
                  className={`form-input ${formErrors.date ? 'error' : ''}`}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
                {formErrors.date && <div className="form-error">{formErrors.date}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="received">Received / Settled</option>
                  <option value="outstanding">Outstanding / Due Invoice</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Channel</label>
                <select
                  className="form-input"
                  value={formData.mode}
                  disabled={formData.status === 'outstanding'}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Cheque">Bank Demand Draft / Cheque</option>
                  <option value="Cash">Cash Voucher</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Milestone / Description *</label>
              <textarea
                className={`form-textarea ${formErrors.description ? 'error' : ''}`}
                placeholder="e.g. Retainer for Criminal Appeal argument stage, Hearing fee for 15 Dec..."
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              {formErrors.description && <div className="form-error">{formErrors.description}</div>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Record Entry
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
