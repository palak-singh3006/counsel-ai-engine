const { getAdminClient } = require('../config/supabase');
const { env } = require('../config/env');
const { AppError } = require('../utils/apiResponse');

function sanitizeFilename(filename) {
  return String(filename || 'document')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');
}

async function uploadDocumentFile({ userId, caseId, file }) {
  const admin = getAdminClient();
  const safeName = sanitizeFilename(file.originalname);
  const storagePath = `${userId}/${caseId}/${Date.now()}_${safeName}`;

  const { error } = await admin.storage
    .from(env.supabaseStorageBucket)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype || 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    throw new AppError(`Failed to upload file to storage: ${error.message}`, 502, 'STORAGE_UPLOAD_FAILED');
  }

  return { storagePath };
}

async function createSignedDownloadUrl(storagePath, expiresInSeconds = 300) {
  const admin = getAdminClient();
  const { data, error } = await admin.storage
    .from(env.supabaseStorageBucket)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new AppError(
      `Failed to generate signed download URL: ${error?.message || 'Unknown storage error'}`,
      502,
      'SIGNED_URL_FAILED'
    );
  }

  return data.signedUrl;
}

async function downloadFileBuffer(storagePath) {
  const admin = getAdminClient();
  const { data, error } = await admin.storage
    .from(env.supabaseStorageBucket)
    .download(storagePath);

  if (error || !data) {
    throw new AppError(
      `Failed to retrieve document from storage: ${error?.message || 'File not found in bucket'}`,
      502,
      'STORAGE_DOWNLOAD_FAILED'
    );
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function deleteDocumentFile(storagePath) {
  if (!storagePath) return;
  const admin = getAdminClient();
  const { error } = await admin.storage
    .from(env.supabaseStorageBucket)
    .remove([storagePath]);

  if (error) {
    throw new AppError(`Failed to remove file from storage: ${error.message}`, 502, 'STORAGE_DELETE_FAILED');
  }
}

module.exports = {
  uploadDocumentFile,
  createSignedDownloadUrl,
  downloadFileBuffer,
  deleteDocumentFile,
};
