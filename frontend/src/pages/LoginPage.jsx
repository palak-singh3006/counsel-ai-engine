import { useState } from 'react';
import { Scale, Lock, Mail, User, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../services/api';
import { useToast } from '../components/Toast';

export default function LoginPage() {
  const { login, register } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [firmName, setFirmName] = useState('JK Shukla & Associates');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        toast('Signed in to Counsel Chambers', 'success');
      } else {
        const res = await register({
          email: email.trim(),
          password,
          full_name: fullName.trim() || 'Advocate',
          firm_name: firmName.trim() || 'Counsel Chambers',
        });
        if (res?.data?.emailConfirmationRequired) {
          setInfoMsg(res.message || 'Check your email to confirm your account before signing in.');
          setMode('login');
        } else {
          toast('Advocate account registered successfully', 'success');
        }
      }
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Authentication failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--paper)',
        padding: '24px',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '440px', overflow: 'hidden' }}>
        <div
          style={{
            background: 'var(--midnight)',
            color: '#fff',
            padding: '28px 32px',
            borderBottom: '3px solid var(--brass)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Scale size={22} style={{ color: 'var(--brass-light)' }} />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', letterSpacing: '0.02em' }}>
              Counsel
            </span>
          </div>
          <p style={{ fontSize: '0.857rem', color: 'rgba(255,255,255,0.72)', margin: 0 }}>
            Smart Advocate Office Management & AI Case Intelligence
          </p>
        </div>

        <form className="card-body" style={{ padding: '28px 32px' }} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              type="button"
              className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setMode('login'); setErrorMsg(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setMode('register'); setErrorMsg(''); }}
            >
              Register Advocate
            </button>
          </div>

          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'var(--terracotta-bg)',
                color: 'var(--terracotta-text)',
                fontSize: '0.857rem',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'var(--sage-bg)',
                color: 'var(--sage-text)',
                fontSize: '0.857rem',
                marginBottom: '16px',
              }}
            >
              {infoMsg}
            </div>
          )}

          {mode === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="relative">
                  <input
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Advocate Full Name"
                  />
                  <User size={14} style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-tertiary)' }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Chambers / Law Firm</label>
                <div className="relative">
                  <input
                    className="form-input"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    placeholder="Firm Name"
                  />
                  <Building2 size={14} style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-tertiary)' }} />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="relative">
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="advocate@chambers.in"
                required
              />
              <Mail size={14} style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-tertiary)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="relative">
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <Lock size={14} style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-tertiary)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center', marginTop: '8px', padding: '10px' }}
            disabled={submitting}
          >
            {submitting
              ? mode === 'login'
                ? 'Signing in...'
                : 'Creating account...'
              : mode === 'login'
              ? 'Sign In to Chambers'
              : 'Create Advocate Account'}
          </button>

          <p className="text-caption" style={{ marginTop: '16px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            Private &amp; encrypted chambers workspace
          </p>
        </form>
      </div>
    </div>
  );
}
