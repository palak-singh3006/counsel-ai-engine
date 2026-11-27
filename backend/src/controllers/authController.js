const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, AppError } = require('../utils/apiResponse');
const { getAnonClient, getAdminClient } = require('../config/supabase');

const register = asyncHandler(async (req, res) => {
  const { email, password, full_name, firm_name, phone } = req.body;
  const anon = getAnonClient();

  const { data, error } = await anon.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: full_name || 'Advocate',
        firm_name: firm_name || 'Counsel Chambers',
      },
    },
  });

  if (error) {
    throw new AppError(error.message, 400, 'AUTH_REGISTER_FAILED');
  }

  if (data?.user) {
    try {
      const admin = getAdminClient();
      await admin.from('advocate_profiles').upsert({
        id: data.user.id,
        full_name: full_name || data.user.user_metadata?.full_name || 'Advocate',
        email: data.user.email,
        phone: phone || null,
        firm_name: firm_name || 'Counsel Chambers',
        role: 'Advocate',
      });
    } catch {
      // Non-fatal if admin profile bootstrap is skipped in limited setups
    }
  }

  return sendSuccess(
    res,
    {
      user: data.user,
      token: data.session?.access_token || null,
      refreshToken: data.session?.refresh_token || null,
      emailConfirmationRequired: !data.session,
    },
    data.session
      ? 'Account registered and signed in successfully'
      : 'Account registered. Please verify your email before signing in.',
    201
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const anon = getAnonClient();

  const { data, error } = await anon.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.session) {
    throw new AppError(error?.message || 'Invalid email or password', 401, 'AUTH_LOGIN_FAILED');
  }

  const { data: profile } = await anon
    .from('advocate_profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  return sendSuccess(
    res,
    {
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: data.user,
      profile: profile || {
        id: data.user.id,
        full_name: data.user.user_metadata?.full_name || 'Advocate',
        email: data.user.email,
        role: data.user.user_metadata?.role || 'Advocate',
        firm_name: data.user.user_metadata?.firm_name || 'Counsel Chambers',
      },
    },
    'Signed in successfully'
  );
});

const logout = asyncHandler(async (req, res) => {
  if (req.supabase) {
    await req.supabase.auth.signOut().catch(() => {});
  }
  return sendSuccess(res, {}, 'Logged out successfully');
});

const me = asyncHandler(async (req, res) => {
  const { data: profile } = await req.supabase
    .from('advocate_profiles')
    .select('*')
    .eq('id', req.user.id)
    .maybeSingle();

  return sendSuccess(
    res,
    {
      user: req.user,
      profile: profile || {
        id: req.user.id,
        full_name: req.user.user_metadata?.full_name || 'Advocate',
        email: req.user.email,
        role: req.user.user_metadata?.role || 'Advocate',
        firm_name: req.user.user_metadata?.firm_name || 'Counsel Chambers',
      },
    },
    'Session verified'
  );
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = [
    'full_name',
    'email',
    'phone',
    'firm_name',
    'bar_council_reg',
    'office_address',
    'jurisdiction',
    'notification_prefs',
  ];

  const payload = { id: req.user.id };
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      payload[key] = req.body[key];
    }
  }

  const { data, error } = await req.supabase
    .from('advocate_profiles')
    .upsert(payload)
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 400, 'PROFILE_UPDATE_FAILED');
  }

  return sendSuccess(res, { profile: data }, 'Profile updated successfully');
});

module.exports = {
  register,
  login,
  logout,
  me,
  updateProfile,
};
