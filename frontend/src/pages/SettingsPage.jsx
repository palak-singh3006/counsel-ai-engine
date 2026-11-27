import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Building2,
  Bell,
  Database,
  Info,
  Download,
  AlertTriangle,
  Cpu,
  Check,
  Lock,
  Server,
} from 'lucide-react';
import {
  user,
  clients,
  cases,
  hearings,
  documents,
  payments,
} from '../data/mockData';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

function ToggleSwitch({ id, checked, onChange, label, description }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        padding: 'var(--space-4) 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '0.929rem',
            fontWeight: 500,
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          {label}
        </label>
        {description && (
          <p className="text-small" style={{ marginTop: '2px' }}>
            {description}
          </p>
        )}
      </div>

      <label
        htmlFor={id}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: '42px',
          height: '24px',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{
            position: 'absolute',
            opacity: 0,
            width: '100%',
            height: '100%',
            margin: 0,
            cursor: 'pointer',
          }}
        />
        <span
          aria-hidden="true"
          style={{
            width: '42px',
            height: '24px',
            borderRadius: '999px',
            backgroundColor: checked ? 'var(--midnight)' : 'var(--stone-lighter)',
            border: `1px solid ${checked ? 'var(--midnight)' : 'var(--border-strong)'}`,
            transition: 'background-color 180ms ease, border-color 180ms ease',
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
              boxShadow: '0 1px 2px rgba(15, 17, 24, 0.18)',
              transition: 'left 180ms ease, background-color 180ms ease',
            }}
          />
        </span>
      </label>
    </div>
  );
}

const sectionMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
  const addToast = useToast();

  // Profile Settings state
  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
    phone: '+91 98390 42110',
    role: user.role,
    firm: user.firm,
  });
  const [profileErrors, setProfileErrors] = useState({});

  // Practice Information state
  const [practice, setPractice] = useState({
    firmName: user.firm,
    barCouncilReg: 'UP/04128/1998',
    officeAddress:
      'Chamber 42, High Court Bar Association Building, Vibhuti Khand, Gomti Nagar, Lucknow - 226010',
    jurisdiction:
      'High Court of Judicature at Allahabad (Lucknow Bench), District & Commercial Courts, Tribunals (Delhi & Lucknow)',
  });
  const [practiceErrors, setPracticeErrors] = useState({});

  // Notification Preferences state
  const [notifications, setNotifications] = useState({
    hearingReminders: true,
    paymentAlerts: true,
    documentUploads: true,
    weeklySummary: false,
  });

  // Integration Modal state
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);

  const handleProfileSave = (e) => {
    e.preventDefault();
    const errors = {};
    if (!profile.name.trim()) {
      errors.name = 'Full name is required.';
    }
    if (!profile.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!profile.phone.trim()) {
      errors.phone = 'Contact phone number is required.';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      addToast('Please correct the highlighted profile fields', 'error');
      return;
    }

    setProfileErrors({});
    addToast('Profile settings saved successfully', 'success');
  };

  const handlePracticeUpdate = (e) => {
    e.preventDefault();
    const errors = {};
    if (!practice.firmName.trim()) {
      errors.firmName = 'Firm name is required.';
    }
    if (!practice.barCouncilReg.trim()) {
      errors.barCouncilReg = 'Bar Council registration number is required.';
    }
    if (!practice.officeAddress.trim()) {
      errors.officeAddress = 'Office address is required.';
    }
    if (!practice.jurisdiction.trim()) {
      errors.jurisdiction = 'Primary jurisdiction is required.';
    }

    if (Object.keys(errors).length > 0) {
      setPracticeErrors(errors);
      addToast('Please complete all practice information fields', 'error');
      return;
    }

    setPracticeErrors({});
    addToast('Practice information updated', 'success');
  };

  const handleToggleNotification = (key, label) => (value) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    addToast(`${label} ${value ? 'enabled' : 'disabled'}`, 'info');
  };

  const handleExportData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      application: 'Counsel v1.0.0',
      firm: practice.firmName,
      mode: 'demonstration',
      summary: {
        clients: clients.length,
        cases: cases.length,
        hearings: hearings.length,
        documents: documents.length,
        payments: payments.length,
      },
      data: {
        clients,
        cases,
        hearings,
        documents,
        payments,
      },
    };

    try {
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'counsel-practice-export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback safely if download is blocked in restricted environments
    }

    addToast('Practice demonstration data exported (JSON)', 'success');
  };

  return (
    <div style={{ maxWidth: '880px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your practice configuration</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* a. Profile Settings */}
        <motion.section
          className="card"
          initial={sectionMotion.initial}
          animate={sectionMotion.animate}
          transition={{ duration: 0.22, delay: 0 }}
        >
          <div className="card-header">
            <div className="flex items-center gap-3">
              <User size={17} style={{ color: 'var(--brass)' }} strokeWidth={1.5} />
              <h2 className="card-title">Profile Settings</h2>
            </div>
            <span className="text-caption">Advocate Account</span>
          </div>

          <form className="card-body" onSubmit={handleProfileSave} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-name">
                  Full Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  className={`form-input${profileErrors.name ? ' error' : ''}`}
                  value={profile.name}
                  onChange={(e) => {
                    setProfile((p) => ({ ...p, name: e.target.value }));
                    if (profileErrors.name) {
                      setProfileErrors((err) => ({ ...err, name: undefined }));
                    }
                  }}
                />
                {profileErrors.name && (
                  <p className="form-error">{profileErrors.name}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-email">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className={`form-input${profileErrors.email ? ' error' : ''}`}
                  value={profile.email}
                  onChange={(e) => {
                    setProfile((p) => ({ ...p, email: e.target.value }));
                    if (profileErrors.email) {
                      setProfileErrors((err) => ({ ...err, email: undefined }));
                    }
                  }}
                />
                {profileErrors.email && (
                  <p className="form-error">{profileErrors.email}</p>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-phone">
                  Phone Number
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  className={`form-input${profileErrors.phone ? ' error' : ''}`}
                  value={profile.phone}
                  onChange={(e) => {
                    setProfile((p) => ({ ...p, phone: e.target.value }));
                    if (profileErrors.phone) {
                      setProfileErrors((err) => ({ ...err, phone: undefined }));
                    }
                  }}
                />
                {profileErrors.phone && (
                  <p className="form-error">{profileErrors.phone}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-role">
                  Role (Read-only)
                </label>
                <div className="relative">
                  <input
                    id="profile-role"
                    type="text"
                    className="form-input"
                    value={profile.role}
                    readOnly
                    style={{
                      backgroundColor: 'var(--stone-bg)',
                      color: 'var(--text-secondary)',
                      paddingRight: 'var(--space-8)',
                      cursor: 'default',
                    }}
                  />
                  <Lock
                    size={14}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-tertiary)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="profile-firm">
                Firm Name (Read-only)
              </label>
              <div className="relative">
                <input
                  id="profile-firm"
                  type="text"
                  className="form-input"
                  value={profile.firm}
                  readOnly
                  style={{
                    backgroundColor: 'var(--stone-bg)',
                    color: 'var(--text-secondary)',
                    paddingRight: 'var(--space-8)',
                    cursor: 'default',
                  }}
                />
                <Lock
                  size={14}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)',
                  }}
                />
              </div>
            </div>

            <div
              className="flex items-center justify-between mt-6"
              style={{
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span className="text-caption">
                Role and firm assignment are managed by chambers administration.
              </span>
              <button type="submit" className="btn btn-primary">
                <Check size={15} />
                Save Changes
              </button>
            </div>
          </form>
        </motion.section>

        {/* b. Practice Information */}
        <motion.section
          className="card"
          initial={sectionMotion.initial}
          animate={sectionMotion.animate}
          transition={{ duration: 0.22, delay: 0.05 }}
        >
          <div className="card-header">
            <div className="flex items-center gap-3">
              <Building2 size={17} style={{ color: 'var(--brass)' }} strokeWidth={1.5} />
              <h2 className="card-title">Practice Information</h2>
            </div>
            <span className="text-caption">Chambers &amp; Registration</span>
          </div>

          <form className="card-body" onSubmit={handlePracticeUpdate} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="practice-firm">
                  Firm Name
                </label>
                <input
                  id="practice-firm"
                  type="text"
                  className={`form-input${practiceErrors.firmName ? ' error' : ''}`}
                  value={practice.firmName}
                  onChange={(e) => {
                    setPractice((p) => ({ ...p, firmName: e.target.value }));
                    if (practiceErrors.firmName) {
                      setPracticeErrors((err) => ({ ...err, firmName: undefined }));
                    }
                  }}
                />
                {practiceErrors.firmName && (
                  <p className="form-error">{practiceErrors.firmName}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="practice-bar">
                  Bar Council Registration
                </label>
                <input
                  id="practice-bar"
                  type="text"
                  className={`form-input${practiceErrors.barCouncilReg ? ' error' : ''}`}
                  value={practice.barCouncilReg}
                  onChange={(e) => {
                    setPractice((p) => ({ ...p, barCouncilReg: e.target.value }));
                    if (practiceErrors.barCouncilReg) {
                      setPracticeErrors((err) => ({ ...err, barCouncilReg: undefined }));
                    }
                  }}
                />
                {practiceErrors.barCouncilReg && (
                  <p className="form-error">{practiceErrors.barCouncilReg}</p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="practice-address">
                Office Address
              </label>
              <textarea
                id="practice-address"
                className={`form-textarea${practiceErrors.officeAddress ? ' error' : ''}`}
                style={{ minHeight: '68px' }}
                value={practice.officeAddress}
                onChange={(e) => {
                  setPractice((p) => ({ ...p, officeAddress: e.target.value }));
                  if (practiceErrors.officeAddress) {
                    setPracticeErrors((err) => ({ ...err, officeAddress: undefined }));
                  }
                }}
              />
              {practiceErrors.officeAddress && (
                <p className="form-error">{practiceErrors.officeAddress}</p>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="practice-jurisdiction">
                Jurisdiction
              </label>
              <input
                id="practice-jurisdiction"
                type="text"
                className={`form-input${practiceErrors.jurisdiction ? ' error' : ''}`}
                value={practice.jurisdiction}
                onChange={(e) => {
                  setPractice((p) => ({ ...p, jurisdiction: e.target.value }));
                  if (practiceErrors.jurisdiction) {
                    setPracticeErrors((err) => ({ ...err, jurisdiction: undefined }));
                  }
                }}
              />
              {practiceErrors.jurisdiction && (
                <p className="form-error">{practiceErrors.jurisdiction}</p>
              )}
            </div>

            <div
              className="flex items-center justify-between mt-6"
              style={{
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span className="text-caption">
                Displayed on cause lists, vakalatnamas, and fee memoranda.
              </span>
              <button type="submit" className="btn btn-primary">
                Update
              </button>
            </div>
          </form>
        </motion.section>

        {/* c. Notification Preferences */}
        <motion.section
          className="card"
          initial={sectionMotion.initial}
          animate={sectionMotion.animate}
          transition={{ duration: 0.22, delay: 0.1 }}
        >
          <div className="card-header">
            <div className="flex items-center gap-3">
              <Bell size={17} style={{ color: 'var(--brass)' }} strokeWidth={1.5} />
              <h2 className="card-title">Notification Preferences</h2>
            </div>
            <span className="text-caption">
              {Object.values(notifications).filter(Boolean).length} of 4 active
            </span>
          </div>

          <div className="card-body" style={{ paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)' }}>
            <ToggleSwitch
              id="notif-hearing-reminders"
              checked={notifications.hearingReminders}
              onChange={handleToggleNotification('hearingReminders', 'Hearing reminders')}
              label="Hearing reminders"
              description="Receive morning cause-list alerts for High Court, District Court, and Tribunal listings."
            />

            <ToggleSwitch
              id="notif-payment-alerts"
              checked={notifications.paymentAlerts}
              onChange={handleToggleNotification('paymentAlerts', 'Payment due alerts')}
              label="Payment due alerts"
              description="Notify when client retainers or stage-wise fee installments become overdue."
            />

            <ToggleSwitch
              id="notif-document-uploads"
              checked={notifications.documentUploads}
              onChange={handleToggleNotification('documentUploads', 'Document upload notifications')}
              label="Document upload notifications"
              description="Alert when associates file pleadings, order sheets, or vakalatnamas to a matter."
            />

            <div style={{ borderBottom: 'none' }}>
              <ToggleSwitch
                id="notif-weekly-summary"
                checked={notifications.weeklySummary}
                onChange={handleToggleNotification('weeklySummary', 'Weekly practice summary')}
                label="Weekly practice summary"
                description="Digest of upcoming week hearings, filing deadlines, and fee realizations every Monday."
              />
            </div>
          </div>
        </motion.section>

        {/* d. Data & Integration */}
        <motion.section
          className="card"
          initial={sectionMotion.initial}
          animate={sectionMotion.animate}
          transition={{ duration: 0.22, delay: 0.15 }}
        >
          <div className="card-header">
            <div className="flex items-center gap-3">
              <Database size={17} style={{ color: 'var(--brass)' }} strokeWidth={1.5} />
              <h2 className="card-title">Data &amp; Integration</h2>
            </div>
            <span className="status-badge status-pending">Demo Environment</span>
          </div>

          <div className="card-body">
            {/* Warning Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--brass-bg)',
                border: '1px solid rgba(184, 150, 62, 0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-5)',
              }}
            >
              <AlertTriangle
                size={17}
                style={{ color: 'var(--brass-muted)', flexShrink: 0, marginTop: '2px' }}
                strokeWidth={1.75}
              />
              <div>
                <p
                  style={{
                    fontSize: '0.857rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  This application is currently running with demonstration data
                </p>
                <p className="text-small" style={{ marginTop: '2px' }}>
                  Changes made in this session remain in local memory and are not persisted to a remote chambers database.
                </p>
              </div>
            </div>

            {/* Status Rows */}
            <div
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-4)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Server size={16} style={{ color: 'var(--text-secondary)' }} strokeWidth={1.5} />
                  <div>
                    <div style={{ fontSize: '0.857rem', fontWeight: 500 }}>
                      Backend API Status
                    </div>
                    <div className="text-caption">
                      Chambers repository &amp; e-Courts sync endpoint
                    </div>
                  </div>
                </div>
                <span className="status-badge status-urgent">Not connected</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-4)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Cpu size={16} style={{ color: 'var(--text-secondary)' }} strokeWidth={1.5} />
                  <div>
                    <div style={{ fontSize: '0.857rem', fontWeight: 500 }}>
                      AI Engine Status
                    </div>
                    <div className="text-caption">
                      Case brief synthesis &amp; precedent research assistant
                    </div>
                  </div>
                </div>
                <span className="status-badge status-pending">Demo mode</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowIntegrationModal(true)}
              >
                <Server size={15} />
                Integration Details
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExportData}
              >
                <Download size={15} />
                Export Data
              </button>
            </div>
          </div>
        </motion.section>

        {/* e. About */}
        <motion.section
          className="card"
          initial={sectionMotion.initial}
          animate={sectionMotion.animate}
          transition={{ duration: 0.22, delay: 0.2 }}
        >
          <div className="card-header">
            <div className="flex items-center gap-3">
              <Info size={17} style={{ color: 'var(--brass)' }} strokeWidth={1.5} />
              <h2 className="card-title">About</h2>
            </div>
            <span className="text-label">Version 1.0.0</span>
          </div>

          <div className="card-body">
            <div
              className="flex items-center justify-between gap-4"
              style={{
                flexWrap: 'wrap',
                paddingBottom: 'var(--space-4)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.286rem',
                    fontWeight: 400,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  Counsel v1.0.0
                </h3>
                <p className="text-small" style={{ marginTop: '2px' }}>
                  Legal Practice Management System
                </p>
              </div>
              <span className="status-badge status-active">Frontend Ready</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 'var(--space-4)',
                paddingTop: 'var(--space-4)',
              }}
            >
              <div>
                <div className="text-label">Chambers</div>
                <p
                  style={{
                    fontSize: '0.929rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginTop: '4px',
                  }}
                >
                  Built for JK Shukla &amp; Associates
                </p>
              </div>
              <div>
                <div className="text-label">Architecture Status</div>
                <p className="text-small" style={{ marginTop: '4px' }}>
                  Frontend application — Backend integration pending
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Integration Details Modal */}
      <Modal
        isOpen={showIntegrationModal}
        onClose={() => setShowIntegrationModal(false)}
        title="Backend & AI Integration"
      >
        <div className="modal-body">
          <p className="text-small mb-4">
            Counsel is currently operating in standalone demonstration mode with{' '}
            <strong>{clients.length} clients</strong>, <strong>{cases.length} matters</strong>,{' '}
            <strong>{hearings.length} scheduled hearings</strong>, and{' '}
            <strong>{documents.length} documents</strong> loaded locally.
          </p>

          <div
            style={{
              backgroundColor: 'var(--stone-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
            }}
          >
            <div className="text-label mb-2">Pending Services</div>
            <ul className="flex flex-col gap-2 text-small">
              <li className="flex items-center justify-between">
                <span>Core Practice REST API</span>
                <span className="status-badge status-urgent">Not connected</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Document Vault Storage</span>
                <span className="status-badge status-urgent">Not connected</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Legal AI Intelligence Engine</span>
                <span className="status-badge status-pending">Demo mode</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowIntegrationModal(false)}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setShowIntegrationModal(false);
              addToast('Connection check queued for backend configuration', 'info');
            }}
          >
            Acknowledge
          </button>
        </div>
      </Modal>
    </div>
  );
}
