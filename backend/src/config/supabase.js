
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const { env, isSupabaseConfigured } = require('./env');

let adminClient = null;
let anonClient = null;

function ensureConfigured() {
  if (!isSupabaseConfigured()) {
    const err = new Error(
      'Supabase is not configured. Please set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in backend/.env.'
    );
    err.statusCode = 503;
    err.code = 'SUPABASE_NOT_CONFIGURED';
    throw err;
  }
}

function getAnonClient() {
  ensureConfigured();

  if (!anonClient) {
    anonClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        transport: WebSocket,
      },
    });
  }

  return anonClient;
}

function getAdminClient() {
  ensureConfigured();

  if (
    !env.supabaseServiceRoleKey ||
    env.supabaseServiceRoleKey.includes('your-supabase-service-role-key')
  ) {
    const err = new Error(
      'SUPABASE_SERVICE_ROLE_KEY is missing or placeholder in backend/.env.'
    );
    err.statusCode = 503;
    err.code = 'SUPABASE_SERVICE_KEY_MISSING';
    throw err;
  }

  if (!adminClient) {
    adminClient = createClient(
      env.supabaseUrl,
      env.supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        realtime: {
          transport: WebSocket,
        },
      }
    );
  }

  return adminClient;
}

/**
 * Creates a per-request Supabase client scoped to the authenticated user's JWT,
 * ensuring PostgreSQL Row Level Security (RLS) policies are strictly enforced.
 */
function createUserClient(accessToken) {
  ensureConfigured();

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: WebSocket,
    },
  });
}

module.exports = {
  getAnonClient,
  getAdminClient,
  createUserClient,
};
