const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, AppError } = require('../utils/apiResponse');

function formatCase(row) {
  const clientName = row.clients?.full_name || '';
  return {
    id: row.id,
    case_number: row.case_number,
    title: row.title,
    client_id: row.client_id,
    clientId: row.client_id,
    client: clientName,
    case_type: row.case_type,
    caseType: row.case_type,
    court_name: row.court_name,
    court: row.court_name,
    judge_name: row.judge_name || '',
    filing_date: row.filing_date,
    filingDate: row.filing_date,
    status: row.status,
    assigned_advocate: row.assigned_advocate || '',
    description: row.description || '',
    next_hearing_date: row.next_hearing_date,
    nextHearing: row.next_hearing_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const listCases = asyncHandler(async (req, res) => {
  const { status, caseType, search, clientId } = req.query;

  let query = req.supabase
    .from('cases')
    .select('*, clients(id, full_name, client_code)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (status && status !== 'All') query = query.eq('status', status.toLowerCase());
  if (clientId) query = query.eq('client_id', clientId);

  const { data, error } = await query;
  if (error) throw error;

  let formatted = (data || []).map(formatCase);

  if (caseType && caseType !== 'All') {
    const t = String(caseType).toLowerCase();
    formatted = formatted.filter(
      (c) => c.case_type.toLowerCase() === t || c.case_type.toLowerCase().startsWith(t)
    );
  }

  if (search) {
    const q = String(search).toLowerCase();
    formatted = formatted.filter(
      (c) =>
        c.case_number.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.client.toLowerCase().includes(q) ||
        c.court_name.toLowerCase().includes(q)
    );
  }

  return sendSuccess(res, formatted, 'Cases retrieved successfully');
});

const createCase = asyncHandler(async (req, res) => {
  const clientId = req.body.client_id || req.body.clientId;

  const { data: client, error: clientErr } = await req.supabase
    .from('clients')
    .select('id, full_name')
    .eq('id', clientId)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (clientErr) throw clientErr;
  if (!client) {
    throw new AppError('Associated client not found', 404, 'CLIENT_NOT_FOUND');
  }

  let caseNumber = req.body.case_number;
  if (!caseNumber) {
    const { count } = await req.supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id);
    const year = new Date().getFullYear();
    caseNumber = `CS/${year}/${String((count || 0) + 1).padStart(3, '0')}`;
  }

  const payload = {
    user_id: req.user.id,
    case_number: caseNumber,
    title: req.body.title,
    client_id: clientId,
    case_type: req.body.case_type || req.body.caseType || 'Civil',
    court_name: req.body.court_name || req.body.court,
    judge_name: req.body.judge_name || req.body.judge || null,
    filing_date: req.body.filing_date || req.body.filingDate || new Date().toISOString().split('T')[0],
    status: req.body.status || 'active',
    assigned_advocate:
      req.body.assigned_advocate || req.user.user_metadata?.full_name || 'Advocate',
    description: req.body.description || null,
    next_hearing_date: req.body.next_hearing_date ?? req.body.nextHearing ?? null,
  };

  const { data, error } = await req.supabase
    .from('cases')
    .insert(payload)
    .select('*, clients(id, full_name, client_code)')
    .single();

  if (error) throw error;

  return sendSuccess(res, formatCase(data), 'Case created successfully', 201);
});

const getCaseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: caseRow, error } = await req.supabase
    .from('cases')
    .select('*, clients(id, full_name, client_code, phone, email)')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!caseRow) {
    throw new AppError('Case not found', 404, 'CASE_NOT_FOUND');
  }

  const [{ data: hearings }, { data: documents }, { data: payments }, { data: analyses }] =
    await Promise.all([
      req.supabase
        .from('hearings')
        .select('*')
        .eq('case_id', id)
        .eq('user_id', req.user.id)
        .order('hearing_date', { ascending: true }),
      req.supabase
        .from('documents')
        .select('*')
        .eq('case_id', id)
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false }),
      req.supabase
        .from('payments')
        .select('*')
        .eq('case_id', id)
        .eq('user_id', req.user.id)
        .order('payment_date', { ascending: false }),
      req.supabase
        .from('ai_analyses')
        .select('id, case_id, task, processing_status, created_at, ai_reviews(review_status, certified_at)')
        .eq('case_id', id)
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false }),
    ]);

  return sendSuccess(
    res,
    {
      ...formatCase(caseRow),
      hearings: hearings || [],
      documents: documents || [],
      payments: payments || [],
      ai_analyses: analyses || [],
    },
    'Case retrieved successfully'
  );
});

const updateCase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = {};

  if (req.body.case_number !== undefined) updates.case_number = req.body.case_number;
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.client_id || req.body.clientId) updates.client_id = req.body.client_id || req.body.clientId;
  if (req.body.case_type || req.body.caseType) updates.case_type = req.body.case_type || req.body.caseType;
  if (req.body.court_name || req.body.court) updates.court_name = req.body.court_name || req.body.court;
  if (req.body.judge_name !== undefined || req.body.judge !== undefined) {
    updates.judge_name = req.body.judge_name ?? req.body.judge;
  }
  if (req.body.filing_date || req.body.filingDate) {
    updates.filing_date = req.body.filing_date || req.body.filingDate;
  }
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.assigned_advocate !== undefined) updates.assigned_advocate = req.body.assigned_advocate;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.next_hearing_date !== undefined || req.body.nextHearing !== undefined) {
    updates.next_hearing_date = req.body.next_hearing_date ?? req.body.nextHearing;
  }

  const { data, error } = await req.supabase
    .from('cases')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select('*, clients(id, full_name, client_code)')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new AppError('Case not found', 404, 'CASE_NOT_FOUND');
  }

  return sendSuccess(res, formatCase(data), 'Case updated successfully');
});

const deleteCase = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await req.supabase
    .from('cases')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new AppError('Case not found', 404, 'CASE_NOT_FOUND');
  }

  return sendSuccess(res, { id }, 'Case deleted successfully');
});

module.exports = {
  listCases,
  createCase,
  getCaseById,
  updateCase,
  deleteCase,
};
