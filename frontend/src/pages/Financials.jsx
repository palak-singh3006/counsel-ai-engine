import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, Download, Trash2, CheckCircle2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { paymentService, caseService, extractErrorMessage } from '../services/api';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);

const paymentModes = ['All', 'Bank Transfer', 'UPI', 'Cheque', 'Cash', 'Pending'];
const paymentStatuses = ['All', 'paid', 'partial', 'pending', 'overdue'];

export default function Financials() {
  const toast = useToast();
  const navigate = useNavigate();

  const [paymentList, setPaymentList] = useState([]);
  const [casesList, setCasesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [settleModalItem, setSettleModalItem] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');

  const emptyForm = {
    caseId: '',
    total_fee: '',
    amount_paid: '',
    date: new Date().toISOString().split('T')[0],
    mode: 'Bank Transfer',
    status: 'paid',
    notes: '',
  };
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const fetchPaymentsAndCases = useCallback(async () => {
    setLoading(true);
    try {
      const [payRes, casesRes] = await Promise.all([
        paymentService.getAll(),
        caseService.getAll(),
      ]);
      setPaymentList(payRes.data?.data || []);
      setCasesList(casesRes.data?.data || []);
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to load financial records'), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    Promise.all([paymentService.getAll(), caseService.getAll()])
      .then(([payRes, casesRes]) => {
        if (!active) return;
        setPaymentList(payRes.data?.data || []);
        setCasesList(casesRes.data?.data || []);
      })
      .catch((err) => {
        if (active) toast(extractErrorMessage(err, 'Failed to load financial records'), 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const totalBilled = useMemo(
    () => paymentList.reduce((acc, p) => acc + Number(p.total_fee || 0), 0),
    [paymentList]
  );

  const totalCollected = useMemo(
    () => paymentList.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0),
    [paymentList]
  );

  const totalOutstanding = useMemo(
    () => paymentList.reduce((acc, p) => acc + Number(p.pending_balance || 0), 0),
    [paymentList]
  );

  const caseSummaries = useMemo(() => {
    const map = {};
    paymentList.forEach((p) => {
      if (!map[p.caseId]) {
        map[p.caseId] = {
          caseId: p.caseId,
          caseNumber: p.caseNumber,
          caseTitle: p.caseTitle,
          client: p.client,
          total: 0,
          collected: 0,
          outstanding: 0,
        };
      }
      map[p.caseId].total += Number(p.total_fee || 0);
      map[p.caseId].collected += Number(p.amount_paid || 0);
      map[p.caseId].outstanding += Number(p.pending_balance || 0);
    });
    return Object.values(map).sort((a, b) => b.outstanding - a.outstanding);
  }, [paymentList]);

  const filtered = useMemo(() => {
    return paymentList.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (modeFilter !== 'All' && item.mode !== modeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (item.caseTitle || '').toLowerCase().includes(q) ||
          (item.client || '').toLowerCase().includes(q) ||
          (item.notes || '').toLowerCase().includes(q) ||
          (item.caseNumber || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [paymentList, search, statusFilter, modeFilter]);

  const validateForm = () => {
    const errs = {};
    const fee = Number(formData.total_fee);
    const paid = formData.amount_paid === '' ? 0 : Number(formData.amount_paid);
    if (!formData.caseId) errs.caseId = 'Matter is required';
    if (Number.isNaN(fee) || fee <= 0) errs.total_fee = 'Valid agreed fee is required';
    if (Number.isNaN(paid) || paid < 0) errs.amount_paid = 'Paid amount cannot be negative';
    if (paid > fee) errs.amount_paid = 'Amount paid cannot exceed agreed fee';
    if (formData.status === 'paid' && paid < fee) {
      errs.status = 'Cannot mark fully paid when balance remains';
    }
    if (!formData.date) errs.date = 'Date is required';
    if (!formData.notes.trim()) errs.notes = 'Billing milestone description is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const fee = Number(formData.total_fee);
      const paid = formData.amount_paid === '' ? 0 : Number(formData.amount_paid);
      await paymentService.create({
        case_id: formData.caseId,
        total_fee: fee,
        amount_paid: paid,
        payment_date: formData.date,
        payment_method: paid === 0 ? 'Pending' : formData.mode,
        status: formData.status,
        notes: formData.notes.trim(),
      });
      toast(`Recorded billing entry (${formatINR(fee)})`, 'success');
      closeModal();
      await fetchPaymentsAndCases();
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to record payment'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordInstallment = async (e) => {
    e.preventDefault();
    if (!settleModalItem) return;
    const added = Number(settleAmount);
    if (Number.isNaN(added) || added <= 0) {
      toast('Enter a valid positive installment amount', 'error');
      return;
    }
    const newPaid = Number(settleModalItem.amount_paid) + added;
    if (newPaid > Number(settleModalItem.total_fee)) {
      toast('Installment exceeds remaining pending balance', 'error');
      return;
    }
    setSaving(true);
    try {
      await paymentService.update(settleModalItem.id, {
        amount_paid: newPaid,
        status: newPaid === Number(settleModalItem.total_fee) ? 'paid' : 'partial',
        payment_method:
          settleModalItem.payment_method === 'Pending' ? 'Bank Transfer' : settleModalItem.payment_method,
      });
      toast(`Recorded payment of ${formatINR(added)}`, 'success');
      setSettleModalItem(null);
      setSettleAmount('');
      await fetchPaymentsAndCases();
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to update payment'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async (id) => {
    try {
      await paymentService.delete(id);
      toast('Payment record removed', 'info');
      await fetchPaymentsAndCases();
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to delete payment'), 'error');
    }
  };

  const handleExportCsv = () => {
    const headers = ['Case Number', 'Title', 'Client', 'Date', 'Method', 'Total Fee', 'Amount Paid', 'Pending Balance', 'Status', 'Notes'];
    const rows = filtered.map((p) => [
      p.caseNumber,
      `"${(p.caseTitle || '').replace(/"/g, '""')}"`,
      `"${(p.client || '').replace(/"/g, '""')}"`,
      p.payment_date,
      p.payment_method,
      p.total_fee,
      p.amount_paid,
      p.pending_balance,
      p.status,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'counsel-financial-ledger.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast('Financial ledger exported', 'success');
  };

  const closeModal = () => {
    setShowAddModal(false);
    setFormData(emptyForm);
    setFormErrors({});
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Financials & Accounts</h1>
          <p className="page-subtitle">
            Fee ledgers, partial installments, scheduled invoices, and matter billing records
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportCsv}>
            <Download size={14} /> Export Ledger
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={15} /> Record Payment / Fee
          </button>
        </div>
      </div>

      <div className="financials-metrics-grid">
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div className="text-label" style={{ marginBottom: '6px' }}>Total Agreed Fees</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 400, fontFamily: 'var(--font-serif)' }}>
            {formatINR(totalBilled)}
          </div>
          <div className="text-caption" style={{ marginTop: '8px' }}>
            Across {paymentList.length} recorded billing entries
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--sage)', background: 'linear-gradient(180deg, #ffffff 0%, rgba(107, 143, 113, 0.04) 100%)' }}>
          <div className="text-label" style={{ marginBottom: '6px', color: 'var(--sage-text)' }}>
            Realized Collections
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 400, fontFamily: 'var(--font-serif)', color: 'var(--sage-text)' }}>
            {formatINR(totalCollected)}
          </div>
          <div className="text-caption" style={{ marginTop: '8px', color: 'var(--sage-text)' }}>
            {((totalCollected / (totalBilled || 1)) * 100).toFixed(1)}% recovery rate
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--terracotta)', background: 'var(--terracotta-bg)' }}>
          <div className="text-label" style={{ marginBottom: '6px', color: 'var(--terracotta-text)' }}>
            Pending Balance
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 400, fontFamily: 'var(--font-serif)', color: 'var(--terracotta-text)' }}>
            {formatINR(totalOutstanding)}
          </div>
          <div className="text-caption" style={{ marginTop: '8px', color: 'var(--terracotta-text)' }}>
            {paymentList.filter((p) => Number(p.pending_balance) > 0).length} entries with balance due
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input" style={{ width: '280px' }}>
            <Search />
            <input
              type="text"
              placeholder="Search matter, client, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {paymentStatuses.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.toUpperCase()}</option>
            ))}
          </select>
          <select className="filter-select" value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
            {paymentModes.map((m) => (
              <option key={m} value={m}>{m === 'All' ? 'All Payment Channels' : m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="card-header">
          <span className="card-title">Billing Ledger & Transactions</span>
          <span className="text-caption">{filtered.length} entries shown</span>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading ledger...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Matter & Client</th>
                  <th>Milestone / Notes</th>
                  <th>Method</th>
                  <th style={{ textAlign: 'right' }}>Total Fee</th>
                  <th style={{ textAlign: 'right' }}>Paid</th>
                  <th style={{ textAlign: 'right' }}>Pending</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="text-small">
                      {new Date(item.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ cursor: 'pointer' }} onClick={() => navigate('/matters', { state: { selectedCaseId: item.caseId } })}>
                      <div style={{ fontWeight: 500 }}>{item.caseTitle}</div>
                      <div className="text-caption" style={{ color: 'var(--brass-muted)' }}>
                        {item.client} · {item.caseNumber} &rarr;
                      </div>
                    </td>
                    <td className="text-small" style={{ color: 'var(--text-secondary)' }}>{item.notes || '—'}</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '3px', background: 'var(--stone-bg)', border: '1px solid var(--border-subtle)' }}>
                        {item.payment_method}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatINR(item.total_fee)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--sage-text)', fontWeight: 500 }}>{formatINR(item.amount_paid)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: item.pending_balance > 0 ? 'var(--terracotta-text)' : 'var(--text-tertiary)' }}>
                      {item.pending_balance > 0 ? formatINR(item.pending_balance) : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-badge status-${item.status === 'paid' ? 'received' : 'outstanding'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        {item.pending_balance > 0 && (
                          <button
                            className="btn-ghost btn-sm"
                            title="Record Installment"
                            onClick={() => {
                              setSettleModalItem(item);
                              setSettleAmount(String(item.pending_balance));
                            }}
                            style={{ padding: '4px 8px', color: 'var(--sage-text)' }}
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        <button
                          className="btn-ghost btn-sm"
                          title="Delete Entry"
                          onClick={() => handleDeletePayment(item.id)}
                          style={{ padding: '4px 8px', color: 'var(--terracotta)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state">
                        <h3>No financial records found</h3>
                        <p>Record a fee or adjust your filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Case-wise Reconciliation */}
      <div className="card">
        <div className="card-header">
          <div>
            <span className="card-title">Matter-Wise Accounts Reconciliation</span>
            <div className="text-caption" style={{ marginTop: '2px' }}>
              Fee realization and pending balances grouped by legal matter
            </div>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Matter Reference</th>
                <th>Client</th>
                <th style={{ textAlign: 'right' }}>Total Agreed</th>
                <th style={{ textAlign: 'right' }}>Collected</th>
                <th style={{ textAlign: 'right' }}>Pending Balance</th>
                <th>Collection Progress</th>
              </tr>
            </thead>
            <tbody>
              {caseSummaries.map((cs) => {
                const percent = Math.min(100, Math.round((cs.collected / (cs.total || 1)) * 100));
                return (
                  <tr key={cs.caseId} style={{ cursor: 'pointer' }} onClick={() => navigate('/matters', { state: { selectedCaseId: cs.caseId } })}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{cs.caseTitle}</div>
                      <div className="text-caption" style={{ color: 'var(--brass-muted)' }}>{cs.caseNumber} &rarr;</div>
                    </td>
                    <td className="text-small">{cs.client}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatINR(cs.total)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--sage-text)', fontWeight: 500 }}>{formatINR(cs.collected)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: cs.outstanding > 0 ? 'var(--terracotta-text)' : 'var(--text-tertiary)' }}>
                      {cs.outstanding > 0 ? formatINR(cs.outstanding) : '—'}
                    </td>
                    <td style={{ width: '160px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--stone-border)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: percent === 100 ? 'var(--sage)' : 'var(--brass)', borderRadius: '3px' }} />
                        </div>
                        <span className="text-caption" style={{ width: '32px', textAlign: 'right' }}>{percent}%</span>
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
      <Modal isOpen={showAddModal} onClose={closeModal} title="Record Fee / Payment Entry">
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
                {casesList.map((c) => (
                  <option key={c.id} value={c.id}>{c.title} — {c.client}</option>
                ))}
              </select>
              {formErrors.caseId && <div className="form-error">{formErrors.caseId}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Total Agreed Fee (INR ₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 100000"
                  className={`form-input ${formErrors.total_fee ? 'error' : ''}`}
                  value={formData.total_fee}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      total_fee: val,
                      amount_paid: prev.status === 'paid' ? val : prev.amount_paid,
                    }));
                  }}
                />
                {formErrors.total_fee && <div className="form-error">{formErrors.total_fee}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Amount Paid Now (INR ₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 40000"
                  className={`form-input ${formErrors.amount_paid ? 'error' : ''}`}
                  value={formData.amount_paid}
                  onChange={(e) => {
                    const val = e.target.value;
                    const fee = Number(formData.total_fee || 0);
                    const paid = Number(val || 0);
                    const autoStatus = paid === 0 ? 'pending' : paid >= fee && fee > 0 ? 'paid' : 'partial';
                    setFormData((prev) => ({ ...prev, amount_paid: val, status: autoStatus }));
                  }}
                />
                {formErrors.amount_paid && <div className="form-error">{formErrors.amount_paid}</div>}
              </div>
            </div>

            <div className="form-row">
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

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className={`form-input ${formErrors.status ? 'error' : ''}`}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="paid">Paid in Full</option>
                  <option value="partial">Partial Payment</option>
                  <option value="pending">Pending / Due</option>
                  <option value="overdue">Overdue</option>
                </select>
                {formErrors.status && <div className="form-error">{formErrors.status}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-input" value={formData.mode} onChange={(e) => setFormData({ ...formData, mode: e.target.value })}>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Cheque">Bank Demand Draft / Cheque</option>
                <option value="Cash">Cash Voucher</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Milestone / Notes *</label>
              <textarea
                className={`form-textarea ${formErrors.notes ? 'error' : ''}`}
                placeholder="e.g. Retainer fee installment..."
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
              {formErrors.notes && <div className="form-error">{formErrors.notes}</div>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Recording...' : 'Record Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Partial Payment / Settle Modal */}
      <Modal isOpen={!!settleModalItem} onClose={() => setSettleModalItem(null)} title="Record Installment Payment">
        {settleModalItem && (
          <form onSubmit={handleRecordInstallment}>
            <div className="modal-body">
              <p className="text-small" style={{ marginBottom: '12px' }}>
                <strong>{settleModalItem.caseTitle}</strong> — Remaining balance: <strong>{formatINR(settleModalItem.pending_balance)}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Installment Amount Received (INR ₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  max={settleModalItem.pending_balance}
                  min={1}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSettleModalItem(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Updating...' : 'Apply Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </motion.div>
  );
}
