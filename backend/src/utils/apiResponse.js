function sendSuccess(res, data = {}, message = 'Operation completed successfully', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

function sendError(res, message = 'An unexpected error occurred', statusCode = 500, code = 'INTERNAL_ERROR', details) {
  const errorPayload = { code };
  if (details !== undefined) {
    errorPayload.details = details;
  }
  return res.status(statusCode).json({
    success: false,
    message,
    error: errorPayload,
  });
}

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

module.exports = {
  sendSuccess,
  sendError,
  AppError,
};
