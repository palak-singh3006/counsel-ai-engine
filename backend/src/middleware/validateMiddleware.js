const { AppError } = require('../utils/apiResponse');

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        field: i.path.join('.') || source,
        message: i.message,
      }));
      return next(
        new AppError(
          issues[0]?.message || 'Request validation failed',
          400,
          'VALIDATION_ERROR',
          issues
        )
      );
    }
    req[source] = parsed.data;
    return next();
  };
}

module.exports = validate;
