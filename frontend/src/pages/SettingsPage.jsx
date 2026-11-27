import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Building2,
  Bell,
  Database,
  Info,
  Download,
  Cpu,
  Check,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  authService,
  aiService,
  clientService,
  caseService,
  hearingService,
  documentService,
  paymentService,
  extractErrorMessage,
} from '../services/api';
import { useToast } from '../components/Toast';

function ToggleSwitch({ id, checked, onChange, label, description }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', padding: 'var(--space-4) 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <label htmlFor={id} style={{ display: 'block', fontSize: '0.929rem', fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer' }}>
          {label}
        </label>
        {description && <p className="text-small" style={{ marginTop: '2px' }}>{description}</p>}
      </div>
      <label htmlFor={id} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: '42px', height: '24px', flexShrink: 0, cursor: 'pointer' }}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', margin: 0, cursor: 'pointer' }}
        />
        <span
          aria-hidden="true"
          style={{
            width: '42px',
            height: '24px',
            borderRadius: '999px',
            backgroundColor: checked ? 'var(--midnight)' : 'var(--stone-lighter)',
            border: `1px solid ${checked ? 'var(--midnight)' : 'var(--border-strong)'}`,
            position: 'relative',
            display: 'block',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: checked ? '20px' : '2px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: checked ? 'var(--brass-light)' : 'white',
              transition: 'left 180ms ease',
            }}
          />
        </span>
      </label>
    </div>
  );
}

export default function SettingsPage() {
  const addToast = useToast();
  const { user, profile, updateProfileState } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: profile?.full_name || user?.user_metadata?.full_name || 'Advocate',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    role: profile?.role || 'Advocate',
    firm: profile?.firm_name || 'Counsel Chambers',
  });
  const [practiceForm, setPracticeForm] = useState({
    firmName: profile?.firm_name || 'Counsel Chambers',
    barCouncilReg: profile?.bar_council_reg || '',
    officeAddress: profile?.office_address || '',
    jurisdiction: profile?.jurisdiction || '',
  });
  const [notifications, setNotifications] = useState(
    profile?.notification_prefs || {
      hearingReminders: true,
      paymentAlerts: true,
      documentUploads: true,
      weeklySummary: false,
    }
  );
  const [aiStatus, setAiStatus] = useState('checking');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function checkHealth() {
      try {
        await aiService.getHealth();
        setAiStatus('available');
      } catch {
        setAiStatus('unavailable');
      }
    }
    checkHealth();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authService.updateProfile({
        full_name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
      });
      if (res.data?.data?.profile) updateProfileState(res.data.data.profile);
      addToast('Profile settings saved', 'success');
    } catch (err) {
      addToast(extractErrorMessage(err, 'Unable to update profile settings'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePracticeUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authService.updateProfile({
        firm_name: practiceForm.firmName.trim(),
        bar_council_reg: practiceForm.barCouncilReg.trim(),
        office_address: practiceForm.officeAddress.trim(),
        jurisdiction: practiceForm.jurisdiction.trim(),
      });
      if (res.data?.data?.profile) updateProfileState(res.data.data.profile);
      addToast('Practice information updated', 'success');
    } catch (err) {
      addToast(extractErrorMessage(err, 'Failed to update practice information'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = (key, label) => async (value) => {
    const nextPrefs = { ...notifications, [key]: value };
    setNotifications(nextPrefs);
    try {
      await authService.updateProfile({ notification_prefs: nextPrefs });
      addToast(`${label} ${value ? 'enabled' : 'disabled'}`, 'info');
    } catch {
      addToast('Failed to save notification preference', 'error');
    }
  };

  const handleExportData = async () => {
    try {
      const [clientsRes, casesRes, hearingsRes, docsRes, paymentsRes] = await Promise.all([
        clientService.getAll(),
        caseService.getAll(),
        hearingService.getAll(),
        documentService.getAll(),
        paymentService.getAll(),
      ]);
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        application: 'Counsel v1.0.0',
        firm: practiceForm.firmName,
        data: {
          clients: clientsRes.data?.data || [],
          cases: casesRes.data?.data || [],
          hearings: hearingsRes.data?.data || [],
          documents: docsRes.data?.data || [],
          payments: paymentsRes.data?.data || [],
        },
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'counsel-practice-records.json';
      link.click();
      URL.revokeObjectURL(url);
      addToast('Practice records exported successfully', 'success');
    } catch (err) {
      addToast(extractErrorMessage(err, 'Unable to export practice records right now'), 'error');
    }
  };

  return (
    <div style={{ maxWidth: '880px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your profile, chambers details, and preferences</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <motion.section className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card-header">
            <div className="flex items-center gap-3">
              <User size={17} style={{ color: 'var(--brass)' }} />
              <h2 className="card-title">Profile Settings</h2>
            </div>
            <span className="text-caption">Advocate Account</span>
          </div>
          <form className="card-body" onSubmit={handleProfileSave}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <div className="relative">
                  <input className="form-input" value={profileForm.role} readOnly style={{ backgroundColor: 'var(--stone-bg)' }} />
                  <Lock size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end mt-4">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Check size={15} /> Save Changes
              </button>
            </div>
          </form>
        </motion.section>

        <motion.section className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card-header">
            <div className="flex items-center gap-3">
              <Building2 size={17} style={{ color: 'var(--brass)' }} />
              <h2 className="card-title">Practice Information</h2>
            </div>
          </div>
          <form className="card-body" onSubmit={handlePracticeUpdate}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Firm Name</label>
                <input className="form-input" value={practiceForm.firmName} onChange={(e) => setPracticeForm({ ...practiceForm, firmName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Bar Council Registration</label>
                <input className="form-input" value={practiceForm.barCouncilReg} onChange={(e) => setPracticeForm({ ...practiceForm, barCouncilReg: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Office Address</label>
              <textarea className="form-textarea" rows={2} value={practiceForm.officeAddress} onChange={(e) => setPracticeForm({ ...practiceForm, officeAddress: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Jurisdiction</label>
              <input className="form-input" value={practiceForm.jurisdiction} onChange={(e) => setPracticeForm({ ...practiceForm, jurisdiction: e.target.value })} />
            </div>
            <div className="flex items-center justify-end mt-4">
              <button type="submit" className="btn btn-primary" disabled={saving}>Update Practice</button>
            </div>
          </form>
        </motion.section>

        <motion.section className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card-header">
            <div className="flex items-center gap-3">
              <Bell size={17} style={{ color: 'var(--brass)' }} />
              <h2 className="card-title">Notification Preferences</h2>
            </div>
          </div>
          <div className="card-body">
            <ToggleSwitch id="notif-hearing" checked={Boolean(notifications.hearingReminders)} onChange={handleToggleNotification('hearingReminders', 'Hearing reminders')} label="Hearing reminders" description="Cause-list alerts for court listings." />
            <ToggleSwitch id="notif-payment" checked={Boolean(notifications.paymentAlerts)} onChange={handleToggleNotification('paymentAlerts', 'Payment due alerts')} label="Payment due alerts" description="Alerts for overdue or partial fee installments." />
            <ToggleSwitch id="notif-docs" checked={Boolean(notifications.documentUploads)} onChange={handleToggleNotification('documentUploads', 'Document upload notifications')} label="Document upload notifications" description="Alert when documents are uploaded to a matter." />
            <ToggleSwitch id="notif-weekly" checked={Boolean(notifications.weeklySummary)} onChange={handleToggleNotification('weeklySummary', 'Weekly summary')} label="Weekly practice summary" description="Weekly digest of hearings and collections." />
          </div>
        </motion.section>

        <motion.section className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card-header">
            <div className="flex items-center gap-3">
              <Database size={17} style={{ color: 'var(--brass)' }} />
              <h2 className="card-title">Practice Data &amp; Assistant Availability</h2>
            </div>
          </div>
          <div className="card-body">
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)' }}>
                <div className="flex items-center gap-3">
                  <Cpu size={16} />
                  <div>
                    <div style={{ fontSize: '0.857rem', fontWeight: 500 }}>AI Case Assistant</div>
                    <div className="text-caption">Document analysis, timelines, and case preparation</div>
                  </div>
                </div>
                <span className={`status-badge ${aiStatus === 'available' ? 'status-active' : aiStatus === 'checking' ? 'status-pending' : 'status-urgent'}`}>
                  {aiStatus === 'available'
                    ? 'Available'
                    : aiStatus === 'checking'
                    ? 'Checking...'
                    : 'Temporarily unavailable'}
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" className="btn btn-primary" onClick={handleExportData}>
                <Download size={15} /> Export Practice Records
              </button>
            </div>
          </div>
        </motion.section>

        <motion.section className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card-header">
            <div className="flex items-center gap-3">
              <Info size={17} style={{ color: 'var(--brass)' }} />
              <h2 className="card-title">About Counsel</h2>
            </div>
            <span className="text-label">Version 1.0.0</span>
          </div>
          <div className="card-body">
            <p className="text-small">
              Counsel — Smart Advocate Office Management System for managing clients, matters, court hearings, legal documents, billing, and AI-assisted case preparation.
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
