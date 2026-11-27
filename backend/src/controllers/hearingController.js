const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, AppError } = require('../utils/apiResponse');

function formatHearing(row) {
  const todayStr = new Date().toISOString().split('T')[0];
  let derivedStatus = row.status;
  if (row.status === 'upcoming' && row.hearing_date === todayStr) {
    derivedStatus = 'today';
  }

  return {
    id: row.id,
    case_id: row.case_id,
    caseId: row.case_id,
    caseNumber: row.cases?.case_number || '',
    caseTitle: row.cases?.title || '',
    client: row.cases?.clients?.full_name || '',
    hearing_date: row.hearing_date,
    date: row.hearing_date,
    hearing_time: row.hearing_time || '10:30',
    time: row.hearing_time || '10:30',
    court_name: row.court_name,
    court: row.court_name,
    judge_name: row.judge_name || '',
    hearing_type: row.hearing_type || 'Hearing',
    type: row.hearing_type || 'Hearing',
    notes: row.notes || '',
    status: derivedStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const listHearings = asyncHandler(async (req, res) => {
  const { caseId, hearingDate, date, startDate, endDate, status } = req.query;

  let query = req.supabase
    .from('hearings')
    .select('*, cases(id, case_number, title, clients(full_name))')
    .eq('user_id', req.user.id)
    .order('hearing_date', { ascending: true });

  if (caseId) query = query.eq('case_id', caseId);
  const exactDate = hearingDate || date;
  if (exactDate) query = query.eq('hearing_date', exactDate);
  if (startDate) query = query.gte('hearing_date', startDate);
  if (endDate) query = query.lte('hearing_date', endDate);
  if (status && status !== 'All') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;

  return sendSuccess(res, (data || []).map(formatHearing), 'Hearings retrieved successfully');
});

const createHearing = asyncHandler(async (req, res) => {
  const caseId = req.body.case_id || req.body.caseId;
  const hearingDate = req.body.hearing_date || req.body.date;

  const { data: caseRow, error: caseErr } = await req.supabase
    .from('cases')
    .select('id, court_name, judge_name, next_hearing_date')
    .eq('id', caseId)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (caseErr) throw caseErr;
  if (!caseRow) {
    throw new AppError('Associated case not found', 404, 'CASE_NOT_FOUND');
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const status = req.body.status || (hearingDate === todayStr ? 'today' : 'upcoming');

  const payload = {
    user_id: req.user.id,
    case_id: caseId,
    hearing_date: hearingDate,
    hearing_time: req.body.hearing_time || req.body.time || '10:30',
    court_name: req.body.court_name || req.body.court || caseRow.court_name,
    judge_name: req.body.judge_name || req.body.judge || caseRow.judge_name || null,
    hearing_type: req.body.hearing_type || req.body.type || 'Hearing',
    notes: req.body.notes || null,
    status,
  };

  const { data, error } = await req.supabase
    .from('hearings')
    .insert(payload)
    .select('*, cases(id, case_number, title, clients(full_name))')
    .single();

  if (error) throw error;

  // Keep case's next_hearing_date in sync when scheduling future/today hearing
  if (
    hearingDate >= todayStr &&
    (!caseRow.next_hearing_date || hearingDate < caseRow.next_hearing_date)
  ) {
    await req.supabase
      .from('cases')
      .update({ next_hearing_date: hearingDate })
      .eq('id', caseId)
      .eq('user_id', req.user.id);
  }

  return sendSuccess(res, formatHearing(data), 'Hearing scheduled successfully', 201);
});

const getHearingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await req.supabase
    .from('hearings')
    .select('*, cases(id, case_number, title, clients(full_name))')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new AppError('Hearing not found', 404, 'HEARING_NOT_FOUND');
  }

  return sendSuccess(res, formatHearing(data), 'Hearing retrieved successfully');
});

const updateHearing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = {};

  if (req.body.case_id || req.body.caseId) updates.case_id = req.body.case_id || req.body.caseId;
  if (req.body.hearing_date || req.body.date) {
    updates.hearing_date = req.body.hearing_date || req.body.date;
  }
  if (req.body.hearing_time !== undefined || req.body.time !== undefined) {
    updates.hearing_time = req.body.hearing_time ?? req.body.time;
  }
  if (req.body.court_name || req.body.court) {
    updates.court_name = req.body.court_name || req.body.court;
  }
  if (req.body.judge_name !== undefined || req.body.judge !== undefined) {
    updates.judge_name = req.body.judge_name ?? req.body.judge;
  }
  if (req.body.hearing_type !== undefined || req.body.type !== undefined) {
    updates.hearing_type = req.body.hearing_type ?? req.body.type;
  }
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  if (req.body.status !== undefined) updates.status = req.body.status;

  const { data, error } = await req.supabase
    .from('hearings')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select('*, cases(id, case_number, title, clients(full_name))')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new AppError('Hearing not found', 404, 'HEARING_NOT_FOUND');
  }

  return sendSuccess(res, formatHearing(data), 'Hearing updated successfully');
});

const deleteHearing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await req.supabase
    .from('hearings')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new AppError('Hearing not found', 404, 'HEARING_NOT_FOUND');
  }

  return sendSuccess(res, { id }, 'Hearing deleted successfully');
});

module.exports = {
  listHearings,
  createHearing,
  getHearingById,
  updateHearing,
  deleteHearing,
};
