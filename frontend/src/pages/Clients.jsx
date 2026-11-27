import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, Phone, Mail, MapPin } from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { clients as initialClients, cases } from '../data/mockData';

const clientTypes = ['All', 'Individual', 'Corporate'];
const statusOptions = ['All', 'active', 'inactive'];

export default function Clients() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [clientList, setClientList] = useState(initialClients);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(() => {
    const id = location.state?.selectedClientId;
    return id ? initialClients.find((c) => c.id === id) || null : null;
  });
  const [prevNavKey, setPrevNavKey] = useState(location.key);
  const [editClient, setEditClient] = useState(null);

  if (location.key !== prevNavKey) {
    setPrevNavKey(location.key);
    if (location.state?.selectedClientId) {
      const found = clientList.find((c) => c.id === location.state.selectedClientId);
      if (found) {
        setShowDetail(found);
      }
    }
  }

  // Form state
  const emptyForm = { name: '', type: 'Individual', phone: '', email: '', address: '' };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const filtered = useMemo(() => {
    return clientList.filter((c) => {
      if (typeFilter !== 'All' && c.type !== typeFilter) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q)
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

  const handleSubmit = () => {
    if (!validate()) return;
    if (editClient) {
      setClientList((prev) =>
        prev.map((c) => (c.id === editClient.id ? { ...c, ...form } : c))
      );
      toast('Client updated successfully', 'success');
    } else {
      const newClient = {
        ...form,
        id: `CL${String(clientList.length + 1).padStart(3, '0')}`,
        matters: 0,
        status: 'active',
        addedDate: new Date().toISOString().split('T')[0],
      };
      setClientList((prev) => [...prev, newClient]);
      toast('Client added successfully', 'success');
    }
    closeForm();
  };

  const closeForm = () => {
    setShowAdd(false);
    setEditClient(null);
    setForm(emptyForm);
    setErrors({});
  };

  const openEdit = (client) => {
    setForm({ name: client.name, type: client.type, phone: client.phone, email: client.email, address: client.address });
    setEditClient(client);
    setShowAdd(true);
    setShowDetail(null);
  };

  const clientCases = showDetail
    ? cases.filter((c) => c.clientId === showDetail.id)
    : [];

  const activeCount = clientList.filter((c) => c.status === 'active').length;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Page Header */}
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

      {/* Toolbar */}
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

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Contact</th>
                <th style={{ textAlign: 'center' }}>Matters</th>
                <th>Status</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setShowDetail(c)}>
                  <td className="text-caption">{c.id}</td>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>
                    <span
                      className="text-label"
                      style={{
                        background: c.type === 'Corporate' ? 'var(--brass-bg)' : 'var(--stone-bg)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        color: c.type === 'Corporate' ? 'var(--brass-muted)' : 'var(--text-tertiary)',
                      }}
                    >
                      {c.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.857rem' }}>{c.phone}</div>
                    <div className="text-caption">{c.email}</div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{c.matters}</td>
                  <td>
                    <span className={`status-badge status-${c.status}`}>{c.status}</span>
                  </td>
                  <td className="text-small">
                    {new Date(c.addedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                      <h3>No clients found</h3>
                      <p>Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
          <button className="btn btn-primary" onClick={handleSubmit}>
            {editClient ? 'Save Changes' : 'Add Client'}
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
                  <div style={{ fontSize: '1.071rem', fontWeight: 500 }}>{showDetail.name}</div>
                </div>
                <div>
                  <div className="text-label" style={{ marginBottom: '4px' }}>Type</div>
                  <div>{showDetail.type}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} style={{ color: 'var(--text-tertiary)' }} /> {showDetail.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} style={{ color: 'var(--text-tertiary)' }} /> {showDetail.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} style={{ color: 'var(--text-tertiary)' }} /> {showDetail.address}
                </div>
              </div>

              {/* Associated Matters */}
              <div style={{ marginTop: '16px' }}>
                <div className="text-label" style={{ marginBottom: '12px' }}>Associated Matters</div>
                {clientCases.length > 0 ? (
                  clientCases.map((cs) => (
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
                        transition: 'background 0.15s ease',
                      }}
                      onClick={() => {
                        setShowDetail(null);
                        navigate('/matters', { state: { selectedCaseId: cs.id } });
                      }}
                      title="View matter details in Matters"
                    >
                      <div>
                        <div style={{ fontSize: '0.857rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {cs.title}
                        </div>
                        <div className="text-caption">{cs.id} · {cs.court} · Click to view matter</div>
                      </div>
                      <span className={`status-badge status-${cs.status}`}>{cs.status}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-caption">No associated matters</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => openEdit(showDetail)}>
                Edit Client
              </button>
              <button className="btn btn-ghost" onClick={() => setShowDetail(null)}>
                Close
              </button>
            </div>
          </>
        )}
      </Modal>
    </motion.div>
  );
}
