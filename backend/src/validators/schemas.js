const { z } = require('zod');

const uuidString = z.string().uuid('Must be a valid UUID');
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const registerSchema = z.object({
  email: z.string().trim().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().trim().min(2, 'Full name is required').optional(),
  firm_name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});

// Clients: supports both full_name (prompt) and name (frontend)
const createClientSchema = z
  .object({
    full_name: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    client_type: z.enum(['Individual', 'Corporate']).optional(),
    type: z.enum(['Individual', 'Corporate']).optional(),
    phone: z.string().trim().min(3, 'Phone number is required'),
    email: z.string().trim().email('Invalid email format').optional().or(z.literal('')),
    address: z.string().trim().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    notes: z.string().trim().optional(),
  })
  .refine((val) => Boolean(val.full_name || val.name), {
    message: 'full_name is required',
    path: ['full_name'],
  });

const updateClientSchema = z
  .object({
    full_name: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    client_type: z.enum(['Individual', 'Corporate']).optional(),
    type: z.enum(['Individual', 'Corporate']).optional(),
    phone: z.string().trim().min(3).optional(),
    email: z.string().trim().email('Invalid email format').optional().or(z.literal('')),
    address: z.string().trim().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    notes: z.string().trim().optional(),
  })
  .refine((val) => Object.keys(val).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Cases: supports canonical DB fields + frontend aliases
const createCaseSchema = z
  .object({
    case_number: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1, 'Case title is required'),
    client_id: uuidString.optional(),
    clientId: uuidString.optional(),
    case_type: z.string().trim().min(1).optional(),
    caseType: z.string().trim().min(1).optional(),
    court_name: z.string().trim().min(1).optional(),
    court: z.string().trim().min(1).optional(),
    judge_name: z.string().trim().optional(),
    judge: z.string().trim().optional(),
    filing_date: dateString.optional(),
    filingDate: dateString.optional(),
    status: z.enum(['active', 'pending', 'closed', 'disposed']).optional(),
    assigned_advocate: z.string().trim().optional(),
    description: z.string().trim().optional(),
    next_hearing_date: dateString.nullable().optional(),
    nextHearing: dateString.nullable().optional(),
  })
  .refine((val) => Boolean(val.client_id || val.clientId), {
    message: 'client_id is required',
    path: ['client_id'],
  })
  .refine((val) => Boolean(val.court_name || val.court), {
    message: 'court_name is required',
    path: ['court_name'],
  });

const updateCaseSchema = z
  .object({
    case_number: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    client_id: uuidString.optional(),
    clientId: uuidString.optional(),
    case_type: z.string().trim().min(1).optional(),
    caseType: z.string().trim().min(1).optional(),
    court_name: z.string().trim().min(1).optional(),
    court: z.string().trim().min(1).optional(),
    judge_name: z.string().trim().optional(),
    judge: z.string().trim().optional(),
    filing_date: dateString.optional(),
    filingDate: dateString.optional(),
    status: z.enum(['active', 'pending', 'closed', 'disposed']).optional(),
    assigned_advocate: z.string().trim().optional(),
    description: z.string().trim().optional(),
    next_hearing_date: dateString.nullable().optional(),
    nextHearing: dateString.nullable().optional(),
  })
  .refine((val) => Object.keys(val).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Hearings
const createHearingSchema = z
  .object({
    case_id: uuidString.optional(),
    caseId: uuidString.optional(),
    hearing_date: dateString.optional(),
    date: dateString.optional(),
    hearing_time: z.string().trim().optional(),
    time: z.string().trim().optional(),
    court_name: z.string().trim().optional(),
    court: z.string().trim().optional(),
    judge_name: z.string().trim().optional(),
    judge: z.string().trim().optional(),
    hearing_type: z.string().trim().optional(),
    type: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    status: z.enum(['upcoming', 'today', 'completed', 'adjourned', 'cancelled']).optional(),
  })
  .refine((val) => Boolean(val.case_id || val.caseId), {
    message: 'case_id is required',
    path: ['case_id'],
  })
  .refine((val) => Boolean(val.hearing_date || val.date), {
    message: 'hearing_date is required (YYYY-MM-DD)',
    path: ['hearing_date'],
  });

const updateHearingSchema = z
  .object({
    case_id: uuidString.optional(),
    caseId: uuidString.optional(),
    hearing_date: dateString.optional(),
    date: dateString.optional(),
    hearing_time: z.string().trim().optional(),
    time: z.string().trim().optional(),
    court_name: z.string().trim().optional(),
    court: z.string().trim().optional(),
    judge_name: z.string().trim().optional(),
    judge: z.string().trim().optional(),
    hearing_type: z.string().trim().optional(),
    type: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    status: z.enum(['upcoming', 'today', 'completed', 'adjourned', 'cancelled']).optional(),
  })
  .refine((val) => Object.keys(val).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Payments
const createPaymentSchema = z
  .object({
    case_id: uuidString.optional(),
    caseId: uuidString.optional(),
    total_fee: z.coerce.number().min(0, 'total_fee cannot be negative').optional(),
    amount: z.coerce.number().min(0, 'amount cannot be negative').optional(),
    amount_paid: z.coerce.number().min(0, 'amount_paid cannot be negative').optional(),
    payment_date: dateString.optional(),
    date: dateString.optional(),
    payment_method: z.string().trim().optional(),
    mode: z.string().trim().optional(),
    status: z.enum(['paid', 'partial', 'pending', 'overdue', 'received', 'outstanding']).optional(),
    notes: z.string().trim().optional(),
    description: z.string().trim().optional(),
  })
  .refine((val) => Boolean(val.case_id || val.caseId), {
    message: 'case_id is required',
    path: ['case_id'],
  })
  .refine((val) => val.total_fee !== undefined || val.amount !== undefined, {
    message: 'total_fee (or amount) is required',
    path: ['total_fee'],
  });

const updatePaymentSchema = z
  .object({
    total_fee: z.coerce.number().min(0, 'total_fee cannot be negative').optional(),
    amount: z.coerce.number().min(0, 'amount cannot be negative').optional(),
    amount_paid: z.coerce.number().min(0, 'amount_paid cannot be negative').optional(),
    payment_date: dateString.optional(),
    date: dateString.optional(),
    payment_method: z.string().trim().optional(),
    mode: z.string().trim().optional(),
    status: z.enum(['paid', 'partial', 'pending', 'overdue', 'received', 'outstanding']).optional(),
    notes: z.string().trim().optional(),
    description: z.string().trim().optional(),
  })
  .refine((val) => Object.keys(val).length > 0, {
    message: 'At least one field must be provided for update',
  });

// AI Workflow
const aiWorkflowSchema = z
  .object({
    caseId: uuidString.optional(),
    case_id: uuidString.optional(),
    documentId: uuidString.optional(),
    document_id: uuidString.optional(),
    documentIds: z.array(uuidString).optional(),
    document_ids: z.array(uuidString).optional(),
    task: z.string().trim().optional(),
    instruction: z.string().trim().optional(),
    task_prompt: z.string().trim().optional(),
    documentText: z.string().optional(),
    document_text: z.string().optional(),
    additionalContext: z.string().trim().optional(),
  })
  .refine((val) => Boolean(val.caseId || val.case_id), {
    message: 'caseId is required',
    path: ['caseId'],
  });

const aiReviewSchema = z.object({
  review_status: z.enum(['ai_generated', 'under_review', 'approved', 'rejected']).optional(),
  advocate_comments: z.string().trim().optional(),
  corrected_result: z.record(z.any()).nullable().optional(),
  reviewer_name: z.string().trim().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  createClientSchema,
  updateClientSchema,
  createCaseSchema,
  updateCaseSchema,
  createHearingSchema,
  updateHearingSchema,
  createPaymentSchema,
  updatePaymentSchema,
  aiWorkflowSchema,
  aiReviewSchema,
};
