const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const DISTRIBUTION_PALETTE = [
  '#1a1d2b',
  '#b8963e',
  '#6b8f71',
  '#c4694a',
  '#8a8d96',
  '#2e3348',
  '#a0833a',
  '#b4b7bf',
];

function formatRelativeTime(isoDate) {
  if (!isoDate) return '';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

const getDashboardStats = asyncHandler(async (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [
    { data: clients, error: cErr },
    { data: cases, error: csErr },
    { data: hearings, error: hErr },
    { data: documents, error: dErr },
    { data: payments, error: pErr },
  ] = await Promise.all([
    req.supabase
      .from('clients')
      .select('id, full_name, status, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false }),
    req.supabase
      .from('cases')
      .select('id, case_number, title, case_type, court_name, status, next_hearing_date, created_at, clients(full_name)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false }),
    req.supabase
      .from('hearings')
      .select('id, case_id, hearing_date, hearing_time, court_name, hearing_type, status, created_at, cases(case_number, title, clients(full_name))')
      .eq('user_id', req.user.id)
      .order('hearing_date', { ascending: true }),
    req.supabase
      .from('documents')
      .select('id, document_name, case_id, created_at, cases(title)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    req.supabase
      .from('payments')
      .select('id, case_id, total_fee, amount_paid, pending_balance, status, payment_date, notes, created_at, cases(case_number, title, clients(full_name))')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false }),
  ]);

  if (cErr) throw cErr;
  if (csErr) throw csErr;
  if (hErr) throw hErr;
  if (dErr) throw dErr;
  if (pErr) throw pErr;

  const clientList = clients || [];
  const caseList = cases || [];
  const hearingList = hearings || [];
  const docList = documents || [];
  const paymentList = payments || [];

  const totalClients = clientList.length;
  const activeClients = clientList.filter((c) => c.status === 'active').length;

  const totalCases = caseList.length;
  const activeCases = caseList.filter((c) => c.status === 'active').length;
  const pendingCases = caseList.filter((c) => c.status === 'pending').length;
  const closedCases = caseList.filter((c) => c.status === 'closed' || c.status === 'disposed').length;

  const todaysHearingsList = hearingList
    .filter((h) => h.hearing_date === todayStr && h.status !== 'cancelled')
    .map((h) => ({
      id: h.id,
      caseId: h.case_id,
      caseNumber: h.cases?.case_number || '',
      caseTitle: h.cases?.title || '',
      client: h.cases?.clients?.full_name || '',
      court: h.court_name,
      date: h.hearing_date,
      time: h.hearing_time || '10:30',
      type: h.hearing_type || 'Hearing',
      status: 'today',
    }));

  const upcomingHearingsList = hearingList
    .filter(
      (h) =>
        h.hearing_date > todayStr &&
        h.status !== 'completed' &&
        h.status !== 'cancelled'
    )
    .map((h) => ({
      id: h.id,
      caseId: h.case_id,
      caseNumber: h.cases?.case_number || '',
      caseTitle: h.cases?.title || '',
      client: h.cases?.clients?.full_name || '',
      court: h.court_name,
      date: h.hearing_date,
      time: h.hearing_time || '10:30',
      type: h.hearing_type || 'Hearing',
      status: 'upcoming',
    }));

  let totalAgreedFees = 0;
  let totalAmountCollected = 0;
  let outstandingBalance = 0;
  const overduePaymentsList = [];

  for (const p of paymentList) {
    const fee = Number(p.total_fee || 0);
    const paid = Number(p.amount_paid || 0);
    const pending =
      p.pending_balance !== undefined ? Number(p.pending_balance) : Math.max(0, fee - paid);

    totalAgreedFees += fee;
    totalAmountCollected += paid;
    outstandingBalance += pending;

    if (pending > 0) {
      overduePaymentsList.push({
        id: p.id,
        caseId: p.case_id,
        caseTitle: p.cases?.title || '',
        client: p.cases?.clients?.full_name || '',
        pendingBalance: pending,
        status: p.status,
        notes: p.notes || '',
      });
    }
  }

  // Case distribution by case_type
  const distMap = {};
  for (const c of caseList) {
    const type = c.case_type || 'Other';
    distMap[type] = (distMap[type] || 0) + 1;
  }
  const caseDistribution = Object.entries(distMap).map(([name, value], idx) => ({
    name,
    value,
    fill: DISTRIBUTION_PALETTE[idx % DISTRIBUTION_PALETTE.length],
  }));

  // Recent activities synthesized strictly from real database records
  const activityEvents = [];
  for (const h of hearingList.slice(-4)) {
    activityEvents.push({
      id: `h-${h.id}`,
      type: 'hearing',
      icon: 'calendar',
      text: `Hearing scheduled for ${h.cases?.title || 'Matter'} (${h.hearing_date})`,
      createdAt: h.created_at,
    });
  }
  for (const d of docList.slice(0, 4)) {
    activityEvents.push({
      id: `d-${d.id}`,
      type: 'document',
      icon: 'file',
      text: `${d.document_name} uploaded for ${d.cases?.title || 'Matter'}`,
      createdAt: d.created_at,
    });
  }
  for (const p of paymentList.slice(0, 4)) {
    activityEvents.push({
      id: `p-${p.id}`,
      type: 'payment',
      icon: 'banknote',
      text:
        Number(p.amount_paid) > 0
          ? `₹${Number(p.amount_paid).toLocaleString('en-IN')} collected for ${p.cases?.title || 'Matter'}`
          : `Invoice of ₹${Number(p.total_fee).toLocaleString('en-IN')} recorded for ${p.cases?.title || 'Matter'}`,
      createdAt: p.created_at,
    });
  }
  for (const cl of clientList.slice(0, 3)) {
    activityEvents.push({
      id: `c-${cl.id}`,
      type: 'client',
      icon: 'user-plus',
      text: `Client ${cl.full_name} registered`,
      createdAt: cl.created_at,
    });
  }

  activityEvents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const recentActivities = activityEvents.slice(0, 8).map((ev) => ({
    ...ev,
    time: formatRelativeTime(ev.createdAt),
  }));

  const recentCases = caseList.slice(0, 10).map((c) => ({
    id: c.id,
    caseNumber: c.case_number,
    title: c.title,
    client: c.clients?.full_name || '',
    court: c.court_name,
    caseType: c.case_type,
    status: c.status,
    nextHearing: c.next_hearing_date,
  }));

  return sendSuccess(
    res,
    {
      totalClients,
      activeClients,
      totalCases,
      activeCases,
      pendingCases,
      closedCases,
      upcomingHearings: upcomingHearingsList.length,
      todaysHearings: todaysHearingsList.length,
      totalAgreedFees: Number(totalAgreedFees.toFixed(2)),
      totalAmountCollected: Number(totalAmountCollected.toFixed(2)),
      outstandingBalance: Number(outstandingBalance.toFixed(2)),
      todaysHearingsList,
      upcomingHearingsList: upcomingHearingsList.slice(0, 5),
      overduePaymentsList: overduePaymentsList.slice(0, 5),
      caseDistribution,
      recentCases,
      recentActivities,
    },
    'Dashboard statistics calculated successfully'
  );
});

module.exports = {
  getDashboardStats,
};
