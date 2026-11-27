const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, AppError } = require('../utils/apiResponse');
const storageService = require('../services/storageService');

function getStorage(req) {
  return req.app?.locals?.storage || storageService;
}

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDocument(row, signedUrl = null) {
  return {
    id: row.id,
    case_id: row.case_id,
    caseId: row.case_id,
    caseNumber: row.cases?.case_number || '',
    caseTitle: row.cases?.title || '',
    document_name: row.document_name,
    name: row.document_name,
    document_type: row.document_type,
    type: row.document_type,
    category: row.category || 'Court Filing',
    storage_path: row.storage_path,
    file_url: signedUrl || row.file_url || null,
    file_size: row.file_size,
    size: formatSize(row.file_size),
    mime_type: row.mime_type,
    upload_date: row.upload_date,
    uploadDate: row.upload_date,
    processing_status: row.processing_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const listDocuments = asyncHandler(async (req, res) => {
  const { caseId, category } = req.query;

  let query = req.supabase
    .from('documents')
    .select('*, cases(id, case_number, title)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (caseId) query = query.eq('case_id', caseId);
  if (category && category !== 'All') query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw error;

  return sendSuccess(res, (data || []).map((d) => formatDocument(d)), 'Documents retrieved successfully');
});

const listDocumentsByCase = asyncHandler(async (req, res) => {
  const { caseId } = req.params;

  const { data: caseRow, error: caseErr } = await req.supabase
    .from('cases')
    .select('id')
    .eq('id', caseId)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (caseErr) throw caseErr;
  if (!caseRow) {
    throw new AppError('Case not found', 404, 'CASE_NOT_FOUND');
  }

  const { data, error } = await req.supabase
    .from('documents')
    .select('*, cases(id, case_number, title)')
    .eq('case_id', caseId)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return sendSuccess(
    res,
    (data || []).map((d) => formatDocument(d)),
    'Case documents retrieved successfully'
  );
});

const uploadDocument = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    throw new AppError('Document file is required (.pdf, .docx, or .txt)', 400, 'FILE_REQUIRED');
  }

  const caseId = req.body.case_id || req.body.caseId;
  if (!caseId) {
    throw new AppError('case_id is required to associate document with a case', 400, 'CASE_ID_REQUIRED');
  }

  const { data: caseRow, error: caseErr } = await req.supabase
    .from('cases')
    .select('id, title, case_number')
    .eq('id', caseId)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (caseErr) throw caseErr;
  if (!caseRow) {
    throw new AppError('Associated case not found', 404, 'CASE_NOT_FOUND');
  }

  const ext = path.extname(file.originalname || '').toLowerCase();
  const docType = ext === '.pdf' ? 'PDF' : ext === '.docx' ? 'DOCX' : 'TXT';
  const documentName =
    (req.body.document_name || req.body.name || '').trim() ||
    path.basename(file.originalname, ext);

  const storage = getStorage(req);
  const { storagePath } = await storage.uploadDocumentFile({
    userId: req.user.id,
    caseId,
    file,
  });

  const insertPayload = {
    user_id: req.user.id,
    case_id: caseId,
    document_name: documentName,
    document_type: docType,
    category: (req.body.category || 'Court Filing').trim(),
    storage_path: storagePath,
    file_url: null, // private bucket: signed URLs generated dynamically
    file_size: file.size || file.buffer?.length || 0,
    mime_type: file.mimetype || 'application/octet-stream',
    upload_date: new Date().toISOString().split('T')[0],
    processing_status: 'uploaded',
  };

  const { data, error } = await req.supabase
    .from('documents')
    .insert(insertPayload)
    .select('*, cases(id, case_number, title)')
    .single();

  if (error) {
    // Roll back storage upload if metadata DB write fails
    await storage.deleteDocumentFile(storagePath).catch(() => {});
    throw error;
  }

  return sendSuccess(res, formatDocument(data), 'Document uploaded and indexed successfully', 201);
});

const getDocumentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await req.supabase
    .from('documents')
    .select('*, cases(id, case_number, title)')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
  }

  const storage = getStorage(req);
  const signedUrl = await storage.createSignedDownloadUrl(data.storage_path, 300);

  return sendSuccess(res, formatDocument(data, signedUrl), 'Document retrieved successfully');
});

const downloadDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const stream = req.query.stream === 'true';

  const { data, error } = await req.supabase
    .from('documents')
    .select('*, cases(id, case_number, title)')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
  }

  const storage = getStorage(req);

  if (stream) {
    const buffer = await storage.downloadFileBuffer(data.storage_path);
    const ext = data.document_type.toLowerCase();
    const safeFileName = `${data.document_name.replace(/[^a-zA-Z0-9._-]/g, '_')}.${ext}`;
    res.setHeader('Content-Type', data.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
    return res.send(buffer);
  }

  const signedUrl = await storage.createSignedDownloadUrl(data.storage_path, 300);
  return sendSuccess(
    res,
    {
      downloadUrl: signedUrl,
      expiresIn: 300,
      document: formatDocument(data, signedUrl),
    },
    'Signed download URL generated successfully'
  );
});

const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await req.supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
  }

  const storage = getStorage(req);
  await storage.deleteDocumentFile(data.storage_path);

  const { error: delErr } = await req.supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (delErr) throw delErr;

  return sendSuccess(res, { id }, 'Document deleted successfully');
});

module.exports = {
  listDocuments,
  listDocumentsByCase,
  uploadDocument,
  getDocumentById,
  downloadDocument,
  deleteDocument,
};
