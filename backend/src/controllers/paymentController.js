const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, AppError } = require('../utils/apiResponse');

function resolvePaymentAmountsAndStatus({ totalFee, amountPaid, requestedStatus }) {
  const fee = Number(totalFee);
  let paid = amountPaid !== undefined ? Number(amountPaid) : undefined;

  // Support legacy frontend status values ('received' / 'outstanding')
  if (paid === undefined) {
    if (requestedStatus === 'received' || requestedStatus === 'paid') {
      paid = fee;
    } else {
      paid = 0;
    }
  }

  if (Number.isNaN(fee) || fee < 0) {
    throw new AppError('total_fee must be a non-negative number', 400, 'INVALID_FEE_AMOUNT');
  }
  if (Number.isNaN(paid) || paid < 0) {
    throw new AppError('amount_paid cannot be negative', 400, 'INVALID_PAID_AMOUNT');
  }
  if (paid > fee) {
    throw new AppError(
      'amount_paid cannot exceed total_fee (negative pending balance is not permitted)',
      400,
      'OVERPAYMENT_NOT_ALLOWED'
    );
  }

  const pendingBalance = Number((fee - paid).toFixed(2));

  if ((requestedStatus === 'paid' || requestedStatus === 'received') && pendingBalance > 0) {
    throw new AppError(
      `Cannot mark record as fully paid when an outstanding balance of ${pendingBalance} exists`,
      400,
      'OUTSTANDING_BALANCE_EXISTS'
    );
  }

  let status;
  if (pendingBalance === 0) {
    status = 'paid';
  } else if (paid > 0) {
    status = requestedStatus === 'overdue' ? 'overdue' : 'partial';
  } else {
    status = requestedStatus === 'overdue' ? 'overdue' : 'pending';
  }

  return {
    total_fee: Number(fee.toFixed(2)),
    amount_paid: Number(paid.toFixed(2)),
    pending_balance: pendingBalance,
    status,
  };
}

function formatPayment(row) {
  const totalFee = Number(row.total_fee || 0);
  const amountPaid = Number(row.amount_paid || 0);
  const pendingBalance =
    row.pending_balance !== undefined
      ? Number(row.pending_balance)
      : Number((totalFee - amountPaid).toFixed(2));

  return {
    id: row.id,
    case_id: row.case_id,
    caseId: row.case_id,
    caseNumber: row.cases?.case_number || '',
    caseTitle: row.cases?.title || '',
    client: row.cases?.clients?.full_name || '',
    total_fee: totalFee,
    amount_paid: amountPaid,
    pending_balance: pendingBalance,
    amount: totalFee,
    payment_date: row.payment_date,
    date: row.payment_date,
    payment_method: row.payment_method,
    mode: row.payment_method,
    status: row.status,
    frontendStatus: pendingBalance === 0 ? 'received' : 'outstanding',
    notes: row.notes || '',
    description: row.notes || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const listPayments = asyncHandler(async (req, res) => {
  const { status, caseId } = req.query;

  let query = req.supabase
    .from('payments')
    .select('*, cases(id, case_number, title, clients(full_name))')
    .eq('user_id', req.user.id)
    .order('payment_date', { ascending: false });

  if (caseId) query = query.eq('case_id', caseId);
  if (status && status !== 'All') {
    if (status === 'received') {
      query = query.eq('status', 'paid');
    } else if (status === 'outstanding') {
      query = query.in('status', ['pending', 'partial', 'overdue']);
    } else {
      query = query.eq('status', status);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  const formatted = (data || []).map(formatPayment);
  return sendSuccess(res, formatted, 'Payments retrieved successfully');
});

const getPaymentsByCase = asyncHandler(async (req, res) => {
  const { caseId } = req.params;

  const { data: caseRow, error: caseErr } = await req.supabase
    .from('cases')
    .select('id, case_number, title')
    .eq('id', caseId)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (caseErr) throw caseErr;
  if (!caseRow) {
    throw new AppError('Case not found', 404, 'CASE_NOT_FOUND');
  }

  const { data, error } = await req.supabase
    .from('payments')
    .select('*, cases(id, case_number, title, clients(full_name))')
    .eq('case_id', caseId)
    .eq('user_id', req.user.id)
    .order('payment_date', { ascending: false });

  if (error) throw error;

  const records = (data || []).map(formatPayment);
  const summary = records.reduce(
    (acc, r) => {
      acc.totalFee += r.total_fee;
      acc.amountPaid += r.amount_paid;
      acc.pendingBalance += r.pending_balance;
      return acc;
    },
    { totalFee: 0, amountPaid: 0, pendingBalance: 0 }
  );

  return sendSuccess(
    res,
    {
      caseId,
      summary,
      payments: records,
    },
    'Case financial records retrieved successfully'
  );
});

const createPayment = asyncHandler(async (req, res) => {
  const caseId = req.body.case_id || req.body.caseId;

  const { data: caseRow, error: caseErr } = await req.supabase
    .from('cases')
    .select('id')
    .eq('id', caseId)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (caseErr) throw caseErr;
  if (!caseRow) {
    throw new AppError('Associated case not found', 404, 'CASE_NOT_FOUND');
  }

  const totalFee = req.body.total_fee ?? req.body.amount;
  const computed = resolvePaymentAmountsAndStatus({
    totalFee,
    amountPaid: req.body.amount_paid,
    requestedStatus: req.body.status,
  });

  const payload = {
    user_id: req.user.id,
    case_id: caseId,
    total_fee: computed.total_fee,
    amount_paid: computed.amount_paid,
    payment_date: req.body.payment_date || req.body.date || new Date().toISOString().split('T')[0],
    payment_method:
      computed.amount_paid === 0
        ? req.body.payment_method || req.body.mode || 'Pending'
        : req.body.payment_method || req.body.mode || 'Bank Transfer',
    status: computed.status,
    notes: req.body.notes ?? req.body.description ?? null,
  };

  const { data, error } = await req.supabase
    .from('payments')
    .insert(payload)
    .select('*, cases(id, case_number, title, clients(full_name))')
    .single();

  if (error) throw error;

  return sendSuccess(res, formatPayment(data), 'Payment record created successfully', 201);
});

const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: existing, error: fetchErr } = await req.supabase
    .from('payments')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!existing) {
    throw new AppError('Payment record not found', 404, 'PAYMENT_NOT_FOUND');
  }

  const nextTotalFee = req.body.total_fee ?? req.body.amount ?? existing.total_fee;
  const nextAmountPaid =
    req.body.amount_paid !== undefined
      ? req.body.amount_paid
      : req.body.status === 'paid' || req.body.status === 'received'
      ? existing.amount_paid
      : existing.amount_paid;

  const computed = resolvePaymentAmountsAndStatus({
    totalFee: nextTotalFee,
    amountPaid: nextAmountPaid,
    requestedStatus: req.body.status,
  });

  const updates = {
    total_fee: computed.total_fee,
    amount_paid: computed.amount_paid,
    status: computed.status,
  };

  if (req.body.payment_date || req.body.date) {
    updates.payment_date = req.body.payment_date || req.body.date;
  }
  if (req.body.payment_method || req.body.mode) {
    updates.payment_method = req.body.payment_method || req.body.mode;
  }
  if (req.body.notes !== undefined || req.body.description !== undefined) {
    updates.notes = req.body.notes ?? req.body.description;
  }

  const { data, error } = await req.supabase
    .from('payments')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select('*, cases(id, case_number, title, clients(full_name))')
    .single();

  if (error) throw error;

  return sendSuccess(res, formatPayment(data), 'Payment record updated successfully');
});

const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await req.supabase
    .from('payments')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new AppError('Payment record not found', 404, 'PAYMENT_NOT_FOUND');
  }

  return sendSuccess(res, { id }, 'Payment record deleted successfully');
});

module.exports = {
  listPayments,
  getPaymentsByCase,
  createPayment,
  updatePayment,
  deletePayment,
  resolvePaymentAmountsAndStatus,
};
