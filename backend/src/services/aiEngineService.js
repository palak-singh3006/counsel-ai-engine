const axios = require('axios');
const FormData = require('form-data');
const { env, isAiEngineConfigured } = require('../config/env');
const { AppError } = require('../utils/apiResponse');

function assertAiEngineConfigured(customBaseUrl) {
  const baseUrl = customBaseUrl || env.aiEngineUrl;
  if (!baseUrl && !isAiEngineConfigured()) {
    throw new AppError(
      'AI_ENGINE_URL is not configured in backend environment variables.',
      503,
      'AI_ENGINE_NOT_CONFIGURED'
    );
  }
  return baseUrl.replace(/\/+$/, '');
}

function validateAiEnginePayload(data) {
  if (
    !data ||
    typeof data !== 'object' ||
    !data.document_analyst ||
    typeof data.document_analyst !== 'object' ||
    !data.timeline ||
    typeof data.timeline !== 'object' ||
    !data.actions ||
    typeof data.actions !== 'object'
  ) {
    throw new AppError(
      'AI Engine returned a malformed response structure.',
      502,
      'AI_ENGINE_MALFORMED_RESPONSE'
    );
  }
  return data;
}

function mapAxiosError(err) {
  if (err instanceof AppError) return err;

  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    return new AppError(
      'Counsel AI Engine timed out while analyzing the legal documents.',
      504,
      'AI_ENGINE_TIMEOUT'
    );
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || !err.response) {
    return new AppError(
      'Counsel AI Engine service is currently unavailable. Ensure the FastAPI service is running.',
      503,
      'AI_ENGINE_UNAVAILABLE'
    );
  }

  const status = err.response.status;
  const detail = err.response.data?.detail || err.response.data?.message || err.message;

  if (status === 400 || status === 422) {
    return new AppError(
      `AI Engine rejected the input: ${detail}`,
      400,
      'AI_ENGINE_VALIDATION_ERROR'
    );
  }

  return new AppError(
    `AI Engine processing failed: ${detail}`,
    502,
    'AI_ENGINE_PROCESSING_ERROR'
  );
}

async function checkAiEngineHealth({ baseUrl, httpClient = axios } = {}) {
  const url = assertAiEngineConfigured(baseUrl);
  try {
    const response = await httpClient.get(`${url}/health`, { timeout: 5000 });
    return response.data;
  } catch (err) {
    throw mapAxiosError(err);
  }
}

async function analyzeFiles({ caseId, matterTitle, files, baseUrl, httpClient = axios }) {
  const url = assertAiEngineConfigured(baseUrl);
  if (!Array.isArray(files) || files.length === 0) {
    throw new AppError('At least one document file is required for file analysis.', 400, 'NO_FILES_PROVIDED');
  }

  const form = new FormData();
  if (caseId) form.append('case_id', String(caseId));
  if (matterTitle) form.append('matter_title', String(matterTitle));

  for (const file of files) {
    form.append('files', file.buffer, {
      filename: file.filename || 'document.txt',
      contentType: file.mimeType || 'application/octet-stream',
    });
  }

  try {
    const response = await httpClient.post(`${url}/analyze`, form, {
      headers: form.getHeaders(),
      timeout: env.aiEngineTimeout,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return validateAiEnginePayload(response.data);
  } catch (err) {
    throw mapAxiosError(err);
  }
}

async function analyzeText({ caseId, matterTitle, caseText, baseUrl, httpClient = axios }) {
  const url = assertAiEngineConfigured(baseUrl);
  if (!caseText || !String(caseText).trim()) {
    throw new AppError('Document text cannot be empty.', 400, 'EMPTY_TEXT');
  }

  try {
    const response = await httpClient.post(
      `${url}/analyze/text`,
      {
        case_id: caseId ? String(caseId) : undefined,
        matter_title: matterTitle ? String(matterTitle) : undefined,
        case_text: String(caseText),
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: env.aiEngineTimeout,
      }
    );
    return validateAiEnginePayload(response.data);
  } catch (err) {
    throw mapAxiosError(err);
  }
}

module.exports = {
  checkAiEngineHealth,
  analyzeFiles,
  analyzeText,
  validateAiEnginePayload,
};
