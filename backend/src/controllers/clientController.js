const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, AppError } = require('../utils/apiResponse');

function formatClient(row, matterCount = 0) {
  return {
    id: row.id,
    client_code: row.client_code,
    full_name: row.full_name,
    name: row.full_name,
    client_type: row.client_type,
    type: row.client_type,
    phone: row.phone,
    email: row.email || '',
    address: row.address || '',
    status: row.status,
    notes: row.notes || '',
    matters: matterCount,
    addedDate: row.created_at ? row.created_at.split('T')[0] : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const listClients = asyncHandler(async (req, res) => {
  const { search, type, status } = req.query;

  let query = req.supabase
    .from('clients')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (type && type !== 'All') query = query.eq('client_type', type);
  if (status && status !== 'All') query = query.eq('status', status);

  const { data: clients, error } = await query;
  if (error) throw error;

  const { data: casesRows } = await req.supabase
    .from('cases')
    .select('client_id')
    .eq('user_id', req.user.id);

  const countMap = {};
  for (const c of casesRows || []) {
    countMap[c.client_id] = (countMap[c.client_id] || 0) + 1;
  }

  let formatted = (clients || []).map((cl) => formatClient(cl, countMap[cl.id] || 0));

  if (search) {
    const q = String(search).toLowerCase();
    formatted = formatted.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.client_code && c.client_code.toLowerCase().includes(q))
    );
  }

  return sendSuccess(res, formatted, 'Clients retrieved successfully');
});

const createClient = asyncHandler(async (req, res) => {
  const { count } = await req.supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.user.id);

  const clientCode = `CL${String((count || 0) + 1).padStart(3, '0')}`;
  const payload = {
    user_id: req.user.id,
    client_code: clientCode,
    full_name: req.body.full_name || req.body.name,
    client_type: req.body.client_type || req.body.type || 'Individual',
    phone: req.body.phone,
    email: req.body.email || null,
    address: req.body.address || null,
    status: req.body.status || 'active',
    notes: req.body.notes || null,
  };

  const { data, error } = await req.supabase
    .from('clients')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return sendSuccess(res, formatClient(data, 0), 'Client created successfully', 201);
});

const getClientById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: client, error } = await req.supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!client) {
    throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
  }

  const { data: casesRows } = await req.supabase
    .from('cases')
    .select('*')
    .eq('client_id', id)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  return sendSuccess(
    res,
    {
      ...formatClient(client, (casesRows || []).length),
      cases: casesRows || [],
    },
    'Client retrieved successfully'
  );
});

const updateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = {};

  if (req.body.full_name || req.body.name) updates.full_name = req.body.full_name || req.body.name;
  if (req.body.client_type || req.body.type) updates.client_type = req.body.client_type || req.body.type;
  if (req.body.phone !== undefined) updates.phone = req.body.phone;
  if (req.body.email !== undefined) updates.email = req.body.email || null;
  if (req.body.address !== undefined) updates.address = req.body.address || null;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.notes !== undefined) updates.notes = req.body.notes || null;

  const { data, error } = await req.supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
  }

  return sendSuccess(res, formatClient(data), 'Client updated successfully');
});

const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await req.supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23503') {
      throw new AppError(
        'Cannot delete client while active or linked legal matters exist',
        409,
        'CLIENT_HAS_CASES'
      );
    }
    throw error;
  }

  if (!data) {
    throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
  }

  return sendSuccess(res, { id }, 'Client deleted successfully');
});

module.exports = {
  listClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
};
