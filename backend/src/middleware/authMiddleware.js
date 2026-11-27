const { getAnonClient, createUserClient } = require('../config/supabase');
const { AppError } = require('../utils/apiResponse');

async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication token is required', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return next(new AppError('Authentication token is empty', 401, 'UNAUTHORIZED'));
    }

    // Allow dependency injection in tests via req.app.locals.authVerifier
    const authVerifier = req.app?.locals?.authVerifier;
    if (typeof authVerifier === 'function') {
      const verified = await authVerifier(token);
      if (!verified || !verified.user) {
        return next(new AppError('Invalid or expired authentication token', 401, 'INVALID_TOKEN'));
      }
      req.user = verified.user;
      req.accessToken = token;
      req.supabase = verified.supabase || req.app.locals.supabaseFactory?.(token);
      return next();
    }

    const anon = getAnonClient();
    const { data, error } = await anon.auth.getUser(token);
    if (error || !data?.user) {
      return next(new AppError('Invalid or expired authentication token', 401, 'INVALID_TOKEN'));
    }

    req.user = data.user;
    req.accessToken = token;
    req.supabase = createUserClient(token);
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { authenticate };
