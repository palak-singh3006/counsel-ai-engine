const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, AppError } = require('../utils/apiResponse');
const aiEngineService = require('../services/aiEngineService');
const { normalizeAiResponse } = require('../services/aiMapperService');
const storageService = require('../services/storageService');

function getAiEngine(req) {
  return req.app?.locals?.aiEngine || aiEngineService;
}

function getStorage(req) {
  return req.app?.locals?.storage || storageService;
}

function attachReviewToAnalysis(analysisRow, reviewRow) {
  const reviewStatus = reviewRow?.review_status || 'ai_generated';
  const baseStructured = analysisRow.structured_result || {};
  return {
    ...baseStructured,
    analysisId: analysisRow.id,
    caseId: analysisRow.case_id,
    task: analysisRow.task,
    processingStatus: analysisRow.processing_status,
    createdAt: analysisRow.created_at,
    updatedAt: analysisRow.updated_at,
    reviewStatus,
    review: reviewRow
      ? {
          id: reviewRow.id,
          reviewStatus: reviewRow.review_status,
          reviewerName: reviewRow.reviewer_name,
          advocateComments: reviewRow.advocate_comments || '',
          correctedResult: reviewRow.corrected_result || null,
          certifiedAt: reviewRow.certified_at,
          updatedAt: reviewRow.updated_at,
        }
      : {
          reviewStatus: 'ai_generated',
          advocateComments: '',
          correctedResult: null,
          certifiedAt: null,
        },
  };
}

const getAiHealth = asyncHandler(async (req, res) => {
  const engine = getAiEngine(req);
  const health = await engine.checkAiEngineHealth();
  return sendSuccess(res, health, 'Counsel AI Engine is healthy');
});

const runAgentWorkflow = asyncHandler(async (req, res) => {
  const caseId = req.body.caseId || req.body.case_id;
  if (!caseId) {
    throw new AppError('caseId is required', 400, 'CASE_ID_REQUIRED');
  }

  // Gather document IDs (single or array, JSON or multipart stringified)
  let documentIds = [];
  const rawDocIds = req.body.documentIds || req.body.document_ids;
  if (Array.isArray(rawDocIds)) {
    documentIds = rawDocIds;
  } else if (typeof rawDocIds === 'string' && rawDocIds.trim()) {
    try {
      const parsed = JSON.parse(rawDocIds);
      if (Array.isArray(parsed)) documentIds = parsed;
    } catch {
      documentIds = rawDocIds.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  const singleDocId = req.body.documentId || req.body.document_id;
  if (singleDocId && !documentIds.includes(singleDocId)) {
    documentIds.push(singleDocId);
  }

  const task = (req.body.task || req.body.instruction || req.body.task_prompt || '').trim();
  const documentText = (req.body.documentText || req.body.document_text || '').trim();
  const additionalContext = (req.body.additionalContext || '').trim();
  const uploadedFiles = Array.isArray(req.files) ? req.files : [];

  if (documentIds.length === 0 && uploadedFiles.length === 0 && !documentText) {
    throw new AppError(
      'Provide at least one documentId/documentIds, uploaded file, or documentText for analysis',
      400,
      'ANALYSIS_INPUT_REQUIRED'
    );
  }

  // 1. Verify case ownership and fetch matter metadata
  const { data: caseRow, error: caseErr } = await req.supabase
    .from('cases')
    .select('id, case_number, title, case_type, court_name')
    .eq('id', caseId)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (caseErr) throw caseErr;
  if (!caseRow) {
    throw new AppError('Case not found', 404, 'CASE_NOT_FOUND');
  }

  // 2. Create initial ai_analyses tracking record
  const { data: analysisRecord, error: insertErr } = await req.supabase
    .from('ai_analyses')
    .insert({
      user_id: req.user.id,
      case_id: caseId,
      document_ids: documentIds,
      task: task || null,
      processing_status: 'processing',
    })
    .select()
    .single();

  if (insertErr) throw insertErr;

  const engine = getAiEngine(req);
  const storage = getStorage(req);

  try {
    let rawAiResult;

    if (documentIds.length > 0 || uploadedFiles.length > 0) {
      const filesForEngine = [];

      // Download stored files from Supabase private Storage
      if (documentIds.length > 0) {
        const { data: docRows, error: docErr } = await req.supabase
          .from('documents')
          .select('*')
          .in('id', documentIds)
          .eq('case_id', caseId)
          .eq('user_id', req.user.id);

        if (docErr) throw docErr;
        if (!docRows || docRows.length === 0) {
          throw new AppError(
            'No matching documents found for this case',
            404,
            'DOCUMENTS_NOT_FOUND'
          );
        }

        await req.supabase
          .from('documents')
          .update({ processing_status: 'processing' })
          .in('id', docRows.map((d) => d.id))
          .eq('user_id', req.user.id);

        for (const doc of docRows) {
          const buffer = await storage.downloadFileBuffer(doc.storage_path);
          const ext = `.${String(doc.document_type || 'txt').toLowerCase()}`;
          const base = path.basename(doc.document_name, path.extname(doc.document_name));
          filesForEngine.push({
            buffer,
            filename: `${base}${ext}`,
            mimeType: doc.mime_type || 'application/octet-stream',
          });
        }
      }

      // Include any directly attached multipart files
      for (const f of uploadedFiles) {
        filesForEngine.push({
          buffer: f.buffer,
          filename: f.originalname,
          mimeType: f.mimetype,
        });
      }

      // If advocate also supplied additional text or instruction, include a context txt file
      if (documentText || task || additionalContext) {
        const contextSections = [];
        if (task) contextSections.push(`ADVOCATE ANALYSIS DIRECTIVE:\n${task}`);
        if (additionalContext) contextSections.push(`ADDITIONAL CASE CONTEXT:\n${additionalContext}`);
        if (documentText) contextSections.push(`SUPPLEMENTAL PLEADING / RECORD TEXT:\n${documentText}`);
        filesForEngine.push({
          buffer: Buffer.from(contextSections.join('\n\n'), 'utf-8'),
          filename: 'advocate_notes_and_context.txt',
          mimeType: 'text/plain',
        });
      }

      rawAiResult = await engine.analyzeFiles({
        caseId: caseRow.case_number || caseRow.id,
        matterTitle: caseRow.title,
        files: filesForEngine,
      });

      if (documentIds.length > 0) {
        await req.supabase
          .from('documents')
          .update({ processing_status: 'processed' })
          .in('id', documentIds)
          .eq('user_id', req.user.id);
      }
    } else {
      // Raw text workflow -> POST /analyze/text
      const parts = [];
      if (task) parts.push(`ADVOCATE DIRECTIVE: ${task}`);
      if (additionalContext) parts.push(`CASE CONTEXT: ${additionalContext}`);
      parts.push(documentText);

      rawAiResult = await engine.analyzeText({
        caseId: caseRow.case_number || caseRow.id,
        matterTitle: caseRow.title,
        caseText: parts.join('\n\n'),
      });
    }

    const normalized = normalizeAiResponse(rawAiResult, {
      analysisId: analysisRecord.id,
      caseId: caseRow.id,
      reviewStatus: 'ai_generated',
    });

    const { data: updatedAnalysis, error: updErr } = await req.supabase
      .from('ai_analyses')
      .update({
        structured_result: normalized,
        raw_ai_response: rawAiResult,
        processing_status: 'completed',
      })
      .eq('id', analysisRecord.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updErr) throw updErr;

    const { data: reviewRow, error: revErr } = await req.supabase
      .from('ai_reviews')
      .insert({
        user_id: req.user.id,
        analysis_id: analysisRecord.id,
        review_status: 'ai_generated',
      })
      .select()
      .single();

    if (revErr) throw revErr;

    return sendSuccess(
      res,
      attachReviewToAnalysis(updatedAnalysis, reviewRow),
      'Case analysis completed successfully'
    );
  } catch (err) {
    // Persist failure state; never return fabricated AI output
    await req.supabase
      .from('ai_analyses')
      .update({
        processing_status: 'failed',
        error_message: err.message,
      })
      .eq('id', analysisRecord.id)
      .eq('user_id', req.user.id);

    if (documentIds.length > 0) {
      await req.supabase
        .from('documents')
        .update({ processing_status: 'failed' })
        .in('id', documentIds)
        .eq('user_id', req.user.id);
    }

    throw err;
  }
});

const listAnalysesByCase = asyncHandler(async (req, res) => {
  const { caseId } = req.params;

  const { data: analyses, error } = await req.supabase
    .from('ai_analyses')
    .select('*, ai_reviews(*)')
    .eq('case_id', caseId)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const formatted = (analyses || []).map((row) => {
    const rev = Array.isArray(row.ai_reviews) ? row.ai_reviews[0] : row.ai_reviews;
    return attachReviewToAnalysis(row, rev);
  });

  return sendSuccess(res, formatted, 'Case AI analyses retrieved successfully');
});

const getAnalysisById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: analysis, error } = await req.supabase
    .from('ai_analyses')
    .select('*, ai_reviews(*)')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!analysis) {
    throw new AppError('AI analysis record not found', 404, 'ANALYSIS_NOT_FOUND');
  }

  const rev = Array.isArray(analysis.ai_reviews) ? analysis.ai_reviews[0] : analysis.ai_reviews;
  return sendSuccess(
    res,
    attachReviewToAnalysis(analysis, rev),
    'AI analysis retrieved successfully'
  );
});

const saveAdvocateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    review_status = 'under_review',
    advocate_comments,
    corrected_result,
    reviewer_name,
  } = req.body;

  const { data: analysis, error: fetchErr } = await req.supabase
    .from('ai_analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!analysis) {
    throw new AppError('AI analysis record not found', 404, 'ANALYSIS_NOT_FOUND');
  }

  const certifiedAt = review_status === 'approved' ? new Date().toISOString() : null;
  const defaultReviewerName =
    reviewer_name || req.user.user_metadata?.full_name || req.user.email || 'Advocate';

  const { data: reviewRow, error: upsertErr } = await req.supabase
    .from('ai_reviews')
    .upsert(
      {
        user_id: req.user.id,
        analysis_id: id,
        reviewed_by: req.user.id,
        reviewer_name: defaultReviewerName,
        review_status,
        advocate_comments: advocate_comments ?? null,
        corrected_result: corrected_result ?? null,
        certified_at: certifiedAt,
      },
      { onConflict: 'analysis_id' }
    )
    .select()
    .single();

  if (upsertErr) throw upsertErr;

  return sendSuccess(
    res,
    attachReviewToAnalysis(analysis, reviewRow),
    review_status === 'approved'
      ? 'AI analysis reviewed and certified by advocate'
      : 'Advocate review saved successfully'
  );
});

const certifyAnalysis = asyncHandler(async (req, res) => {
  req.body = {
    ...req.body,
    review_status: 'approved',
    advocate_comments: req.body.advocate_comments || req.body.notes,
  };
  return saveAdvocateReview(req, res);
});

module.exports = {
  getAiHealth,
  runAgentWorkflow,
  listAnalysesByCase,
  getAnalysisById,
  saveAdvocateReview,
  certifyAnalysis,
};
