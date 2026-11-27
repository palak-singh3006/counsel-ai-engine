import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Clock, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { hearingService, caseService, extractErrorMessage } from '../services/api';

const hearingTypes = ['Arguments', 'Evidence', 'Hearing', 'Admission', 'Conciliation', 'Order'];

export default function Hearings() {
  const toast = useToast();
  const navigate = useNavigate();
  const [hearingList, setHearingList] = useState([]);
  const [casesList, setCasesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState('agenda');
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth()); // 0-indexed

  const emptyForm = { caseId: '', date: '', time: '10:30', court: '', judge: '', type: 'Hearing', notes: '' };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const fetchHearingsAndCases = useCallback(async () => {
    setLoading(true);
    try {
      const [hearingsRes, casesRes] = await Promise.all([
        hearingService.getAll(),
        caseService.getAll(),
      ]);
      setHearingList(hearingsRes.data?.data || []);
      setCasesList(casesRes.data?.data || []);
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to load hearings'), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    Promise.all([hearingService.getAll(), caseService.getAll()])
      .then(([hearingsRes, casesRes]) => {
        if (!active) return;
        setHearingList(hearingsRes.data?.data || []);
        setCasesList(casesRes.data?.data || []);
      })
      .catch((err) => {
        if (active) toast(extractErrorMessage(err, 'Failed to load hearings'), 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const grouped = useMemo(() => {
    const groups = {};
    hearingList.forEach((h) => {
      const dateKey = h.date || h.hearing_date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(h);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [hearingList]);

  const getDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const fmt = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (d.toDateString() === today.toDateString()) return `Today — ${fmt}`;
    if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow — ${fmt}`;
    return fmt;
  };

  const isToday = (dateStr) => new Date(dateStr).toDateString() === new Date().toDateString();

  const validate = () => {
    const e = {};
    if (!form.caseId) e.caseId = 'Case is required';
    if (!form.date) e.date = 'Date is required';
    if (!form.time) e.time = 'Time is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await hearingService.create({
        case_id: form.caseId,
        hearing_date: form.date,
        hearing_time: form.time,
        court_name: form.court || undefined,
        judge_name: form.judge || undefined,
        hearing_type: form.type,
        notes: form.notes,
      });
      toast('Hearing scheduled successfully', 'success');
      setShowAdd(false);
      setForm(emptyForm);
      setErrors({});
      await fetchHearingsAndCases();
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to schedule hearing'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (hearing, status) => {
    try {
      const res = await hearingService.update(hearing.id, { status });
      toast(`Hearing marked as ${status}`, 'success');
      setShowDetail(res.data?.data || { ...hearing, status });
      await fetchHearingsAndCases();
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to update hearing'), 'error');
    }
  };

  const handleDelete = async (hearing) => {
    try {
      await hearingService.delete(hearing.id);
      toast('Hearing removed from calendar', 'info');
      setShowDetail(null);
      await fetchHearingsAndCases();
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to delete hearing'), 'error');
    }
  };

  // Dynamic calendar logic
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const hearingDates = new Set(hearingList.map((h) => h.date || h.hearing_date));
  const todayStr = new Date().toISOString().split('T')[0];

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const dayHearings = selectedDay
    ? hearingList.filter((h) => (h.date || h.hearing_date) === `${monthPrefix}-${String(selectedDay).padStart(2, '0')}`)
    : [];

  const prevMonth = () => {
    setSelectedDay(null);
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    setSelectedDay(null);
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hearing Calendar</h1>
          <p className="page-subtitle">{hearingList.length} hearings scheduled</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add Hearing
          </button>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        <button className={`tab ${view === 'agenda' ? 'active' : ''}`} onClick={() => setView('agenda')}>
          Agenda
        </button>
        <button className={`tab ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>
          Calendar
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading hearing calendar...
        </div>
      ) : view === 'agenda' ? (
        <div>
          {grouped.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No hearings scheduled yet. Click &ldquo;Add Hearing&rdquo; to schedule a court appearance.
            </div>
          ) : (
            grouped.map(([date, items]) => (
              <div key={date} style={{ marginBottom: 'var(--space-6)' }}>
                <div
                  style={{
                    fontSize: '0.786rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: isToday(date) ? 'var(--brass-muted)' : 'var(--text-tertiary)',
                    marginBottom: 'var(--space-3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isToday(date) && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brass)' }} />
                  )}
                  {getDateLabel(date)}
                </div>
                <div className="card">
                  {items.map((h, i) => (
                    <div
                      key={h.id}
                      onClick={() => setShowDetail(h)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '70px 1fr auto',
                        gap: '16px',
                        padding: '14px 20px',
                        borderBottom: i < items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        cursor: 'pointer',
                        background: isToday(date) ? 'rgba(184,150,62,0.03)' : 'transparent',
                        borderLeft: isToday(date) ? '3px solid var(--brass)' : '3px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ fontSize: '0.857rem', fontWeight: 600, color: isToday(date) ? 'var(--brass-muted)' : 'var(--text-secondary)' }}>
                          {h.time}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.929rem', fontWeight: 500 }}>{h.caseTitle}</div>
                        <div className="text-caption" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span>{h.client}</span>
                          <span>·</span>
                          <span>{h.court}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="status-badge status-pending" style={{ fontSize: '0.643rem' }}>
                          {h.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <button className="btn btn-ghost btn-sm" onClick={prevMonth}><ChevronLeft size={16} /></button>
            <span style={{ fontWeight: 600 }}>{monthLabel}</span>
            <button className="btn btn-ghost btn-sm" onClick={nextMonth}><ChevronRight size={16} /></button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', textAlign: 'center' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-label" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  {d}
                </div>
              ))}
              {calendarDays.map((day, i) => {
                const dateStr = day ? `${monthPrefix}-${String(day).padStart(2, '0')}` : '';
                const hasHearing = hearingDates.has(dateStr);
                const isTodayDate = dateStr === todayStr;
                const isSelected = day === selectedDay;
                return (
                  <div
                    key={i}
                    onClick={() => day && setSelectedDay(day)}
                    style={{
                      padding: '10px 0',
                      cursor: day ? 'pointer' : 'default',
                      borderRadius: '6px',
                      background: isSelected ? 'var(--midnight)' : isTodayDate ? 'var(--brass-bg)' : 'transparent',
                      color: isSelected ? 'white' : isTodayDate ? 'var(--brass-muted)' : 'var(--text-primary)',
                      fontWeight: isTodayDate || isSelected ? 600 : 400,
                    }}
                  >
                    {day || ''}
                    {hasHearing && (
                      <div
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: isSelected ? 'white' : 'var(--brass)',
                          margin: '2px auto 0',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {selectedDay && (
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <div className="text-label" style={{ marginBottom: '12px' }}>
                  Hearings on {monthLabel.split(' ')[0]} {selectedDay}, {calYear}
                </div>
                {dayHearings.length > 0 ? (
                  dayHearings.map((h) => (
                    <div
                      key={h.id}
                      style={{ padding: '10px 16px', border: '1px solid var(--border-subtle)', borderRadius: '6px', marginBottom: '8px', cursor: 'pointer' }}
                      onClick={() => setShowDetail(h)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.857rem', fontWeight: 500 }}>{h.caseTitle}</div>
                          <div className="text-caption">{h.time} · {h.court} · {h.type}</div>
                        </div>
                        <span className="status-badge status-pending" style={{ fontSize: '0.643rem' }}>{h.type}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-caption">No hearings on this date.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Hearing Modal */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setForm(emptyForm); setErrors({}); }} title="Schedule Hearing">
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Case *</label>
            <select
              className={`form-input ${errors.caseId ? 'error' : ''}`}
              value={form.caseId}
              onChange={(e) => {
                const c = casesList.find((cs) => cs.id === e.target.value);
                setForm({ ...form, caseId: e.target.value, court: c?.court_name || '' });
              }}
            >
              <option value="">Select a case</option>
              {casesList.filter((c) => c.status !== 'closed').map((c) => (
                <option key={c.id} value={c.id}>{c.title} ({c.case_number})</option>
              ))}
            </select>
            {errors.caseId && <div className="form-error">{errors.caseId}</div>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className={`form-input ${errors.date ? 'error' : ''}`}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              {errors.date && <div className="form-error">{errors.date}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Time *</label>
              <input
                type="time"
                className={`form-input ${errors.time ? 'error' : ''}`}
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
              {errors.time && <div className="form-error">{errors.time}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Court</label>
              <input className="form-input" value={form.court} onChange={(e) => setForm({ ...form, court: e.target.value })} placeholder="Court name" />
            </div>
            <div className="form-group">
              <label className="form-label">Hearing Type</label>
              <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {hearingTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Presiding Judge</label>
            <input className="form-input" value={form.judge} onChange={(e) => setForm({ ...form, judge: e.target.value })} placeholder="Hon. Justice..." />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Hearing notes..." rows={3} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => { setShowAdd(false); setForm(emptyForm); setErrors({}); }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Scheduling...' : 'Schedule Hearing'}
          </button>
        </div>
      </Modal>

      {/* Hearing Detail Modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Hearing Details">
        {showDetail && (
          <>
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{ fontFamily: 'var(--font-serif)', fontSize: '1.143rem', marginBottom: '4px', color: 'var(--brass-muted)', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => {
                    const caseId = showDetail.caseId;
                    setShowDetail(null);
                    navigate('/matters', { state: { selectedCaseId: caseId } });
                  }}
                >
                  {showDetail.caseTitle} &rarr;
                </div>
                <div className="text-caption">{showDetail.caseNumber} · Click title to view matter</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div className="text-label" style={{ marginBottom: '4px' }}>Date</div>
                  <div style={{ fontSize: '0.929rem' }}>
                    {new Date(showDetail.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div>
                  <div className="text-label" style={{ marginBottom: '4px' }}>Time</div>
                  <div style={{ fontSize: '0.929rem' }}>{showDetail.time}</div>
                </div>
                <div>
                  <div className="text-label" style={{ marginBottom: '4px' }}>Court</div>
                  <div style={{ fontSize: '0.929rem' }}>{showDetail.court}</div>
                </div>
                <div>
                  <div className="text-label" style={{ marginBottom: '4px' }}>Type</div>
                  <div style={{ fontSize: '0.929rem' }}>{showDetail.type}</div>
                </div>
                <div>
                  <div className="text-label" style={{ marginBottom: '4px' }}>Client</div>
                  <div style={{ fontSize: '0.929rem' }}>{showDetail.client}</div>
                </div>
                <div>
                  <div className="text-label" style={{ marginBottom: '4px' }}>Status</div>
                  <select
                    className="filter-select"
                    value={showDetail.status}
                    onChange={(e) => handleUpdateStatus(showDetail, e.target.value)}
                  >
                    <option value="today">today</option>
                    <option value="upcoming">upcoming</option>
                    <option value="completed">completed</option>
                    <option value="adjourned">adjourned</option>
                  </select>
                </div>
              </div>
              {showDetail.notes && (
                <div style={{ marginTop: '20px' }}>
                  <div className="text-label" style={{ marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '0.857rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {showDetail.notes}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--terracotta)' }} onClick={() => handleDelete(showDetail)}>
                <Trash2 size={14} /> Remove
              </button>
              <button className="btn btn-ghost" onClick={() => setShowDetail(null)}>Close</button>
            </div>
          </>
        )}
      </Modal>
    </motion.div>
  );
}
