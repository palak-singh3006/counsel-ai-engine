const path = require('path');
const multer = require('multer');
const { AppError } = require('../utils/apiResponse');

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/octet-stream', // some browsers/clients send generic binary for .docx/.txt; extension check guards it
]);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new AppError(
          `Unsupported file format '${ext || 'unknown'}'. Allowed formats: .pdf, .docx, .txt`,
          400,
          'UNSUPPORTED_FILE_TYPE'
        )
      );
    }
    if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new AppError(
          `Unsupported file MIME type '${file.mimetype}'. Allowed formats: PDF, DOCX, TXT`,
          400,
          'UNSUPPORTED_MIME_TYPE'
        )
      );
    }
    return cb(null, true);
  },
});

module.exports = {
  upload,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
};
