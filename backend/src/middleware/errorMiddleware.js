const multer = require('multer');
const { sendError, AppError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

function notFoundHandler(req, res) {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND');
}

function errorHandler(err, req, res, _next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'File size exceeds the 25MB limit', 400, 'FILE_TOO_LARGE');
    }
    return sendError(res, `File upload error: ${err.message}`, 400, 'UPLOAD_ERROR');
  }

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  // Handle PostgreSQL / Supabase common error codes gracefully
  if (err?.code === '23505') {
    return sendError(res, 'A record with the same unique identifier already exists', 409, 'DUPLICATE_RECORD');
  }
  if (err?.code === '23503') {
    return sendError(
      res,
      'Operation violates referential integrity (related record missing or still in use)',
      400,
      'FOREIGN_KEY_VIOLATION'
    );
  }
  if (err?.code === '23514') {
    return sendError(res, 'Data violates a database integrity constraint', 400, 'CONSTRAINT_VIOLATION');
  }
  if (err?.code === '22P02') {
    return sendError(res, 'Invalid identifier or data format', 400, 'INVALID_FORMAT');
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  if (statusCode >= 500) {
    logger.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  const publicMessage =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : err.message || 'An unexpected error occurred';

  return sendError(res, publicMessage, statusCode, code);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
