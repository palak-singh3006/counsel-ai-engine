import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, Phone, Mail, MapPin, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { clientService, extractErrorMessage } from '../services/api';

const clientTypes = ['All', 'Individual', 'Corporate'];
const statusOptions = ['All', 'active', 'inactive'];

export default function Clients() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [clientList, setClientList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [detailCases, setDetailCases] = useState([]);
  const [editClient, setEditClient] = useState(null);

  const emptyForm = { name: '', type: 'Individual', phone: '', email: '', address: '', status: 'active' };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientService.getAll();
      setClientList(res.data?.data || []);
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to load clients'), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    clientService
      .getAll()
      .then((res) => {
        if (active) setClientList(res.data?.data || []);
      })
      .catch((err) => {
        if (active) toast(extractErrorMessage(err, 'Failed to load clients'), 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const openClientDetail = useCallback(
    async (client) => {
      setShowDetail(client);
      setDetailCases([]);
      try {
        const res = await clientService.getById(client.id);
        setDetailCases(res.data?.data?.cases || []);
      } catch (err) {
        toast(extractErrorMessage(err, 'Failed to load client matters'), 'error');
      }
    },
    [toast]
  );

  useEffect(() => {
    const incomingId = location.state?.selectedClientId;
    if (!incomingId || clientList.length === 0) return;
    const found = clientList.find((c) => c.id === incomingId);
    if (!found) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) openClientDetail(found);
    });
    return () => {
      active = false;
    };
  }, [location.state, clientList, openClientDetail]);

  const filtered = useMemo(() => {
    return clientList.filter((c) => {
      const typeVal = c.type || c.client_type;
      const nameVal = c.name || c.full_name || '';
      if (typeFilter !== 'All' && typeVal !== typeFilter) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          nameVal.toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.client_code || '').toLowerCase().includes(q) ||
          (typeVal || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [clientList, search, typeFilter, statusFilter]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        full_name: form.name.trim(),
        client_type: form.type,
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        status: form.status || 'active',
      };

      if (editClient) {
        await clientService.update(editClient.id, payload);
        toast('Client updated successfully', 'success');
      } else {
        await clientService.create(payload);
        toast('Client added successfully', 'success');
      }
      closeForm();
      await fetchClients();
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to save client'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (client) => {
    try {
      await clientService.delete(client.id);
      toast(`Client "${client.name || client.full_name}" removed`, 'info');
      setShowDetail(null);
      await fetchClients();
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to delete client'), 'error');
    }
  };

  const closeForm = () => {
    setShowAdd(false);
    setEditClient(null);
    setForm(emptyForm);
    setErrors({});
  };

  const openEdit = (client) => {
    setForm({
      name: client.name || client.full_name || '',
      type: client.type || client.client_type || 'Individual',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      status: client.status || 'active',
    });
    setEditClient(client);
    setShowAdd(true);
    setShowDetail(null);
  };

  const activeCount = clientList.filter((c) => c.status === 'active').length;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">
            {clientList.length} total clients · {activeCount} active
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
            <Plus size={15} /> Add Client
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input" style={{ maxWidth: '280px' }}>
            <Search />
            <input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {clientTypes.map((t) => (
              <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
            ))}
          </select>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading clients...
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client Ref</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th style={{ textAlign: 'center' }}>Matters</th>
                  <th>Status</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const typeVal = c.type || c.client_type;
                  return (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => openClientDetail(c)}>
                      <td className="text-caption">{c.client_code || c.id.slice(0, 8)}</td>
                      <td style={{ fontWeight: 500 }}>{c.name || c.full_name}</td>
                      <td>
                        <span
                          className="text-label"
                          style={{
                            background: typeVal === 'Corporate' ? 'var(--brass-bg)' : 'var(--stone-bg)',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            color: typeVal === 'Corporate' ? 'var(--brass-muted)' : 'var(--text-tertiary)',
                          }}
                        >
                          {typeVal}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.857rem' }}>{c.phone}</div>
                        <div className="text-caption">{c.email}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 500 }}>{c.matters ?? 0}</td>
                      <td>
                        <span className={`status-badge status-${c.status}`}>{c.status}</span>
                      </td>
                      <td className="text-small">
                        {c.addedDate || c.created_at
                          ? new Date(c.addedDate || c.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <h3>No clients found</h3>
                        <p>Try adjusting your search filters or add a new client.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Client Modal */}
      <Modal isOpen={showAdd} onClose={closeForm} title={editClient ? 'Edit Client' : 'Add New Client'}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              className={`form-input ${errors.name ? 'error' : ''}`}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter client name"
            />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Client Type</label>
              <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="Individual">Individual</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input
                className={`form-input ${errors.phone ? 'error' : ''}`}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
              />
              {errors.phone && <div className="form-error">{errors.phone}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-textarea"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Enter address"
              rows={2}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeForm}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : editClient ? 'Save Changes' : 'Add Client'}
          </button>
        </div>
      </Modal>

      {/* Client Detail Modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Client Details" wide>
        {showDetail && (
          <>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <div className="text-label" style={{ marginBottom: '4px' }}>Name</div>
                  <div style={{ fontSize: '1.071rem', fontWeight: 500 }}>{showDetail.name || showDetail.full_name}</div>
                </div>
                <div>
                  <div className="text-label" style={{ marginBottom: '4px' }}>Type</div>
                  <div>{showDetail.type || showDetail.client_type}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} style={{ color: 'var(--text-tertiary)' }} /> {showDetail.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} style={{ color: 'var(--text-tertiary)' }} /> {showDetail.email || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} style={{ color: 'var(--text-tertiary)' }} /> {showDetail.address || '—'}
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <div className="text-label" style={{ marginBottom: '12px' }}>Associated Matters</div>
                {detailCases.length > 0 ? (
                  detailCases.map((cs) => (
                    <div
                      key={cs.id}
                      style={{
                        padding: '10px 16px',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setShowDetail(null);
                        navigate('/matters', { state: { selectedCaseId: cs.id } });
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.857rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {cs.title}
                        </div>
                        <div className="text-caption">{cs.case_number} · {cs.court_name}</div>
                      </div>
                      <span className={`status-badge status-${cs.status}`}>{cs.status}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-caption">No associated matters</div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--terracotta)' }}
                onClick={() => handleDelete(showDetail)}
              >
                <Trash2 size={14} /> Delete Client
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => openEdit(showDetail)}>
                  Edit Client
                </button>
                <button className="btn btn-ghost" onClick={() => setShowDetail(null)}>
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </motion.div>
  );
}
