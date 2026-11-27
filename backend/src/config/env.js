const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  supabaseUrl: (process.env.SUPABASE_URL || '').trim(),
  supabaseAnonKey: (process.env.SUPABASE_ANON_KEY || '').trim(),
  supabaseServiceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
  supabaseStorageBucket: (process.env.SUPABASE_STORAGE_BUCKET || 'counsel-documents').trim(),
  aiEngineUrl: (process.env.AI_ENGINE_URL || '').trim().replace(/\/+$/, ''),
  aiEngineTimeout: Number(process.env.AI_ENGINE_TIMEOUT) || 120000,
};

function isSupabaseConfigured() {
  return Boolean(
    env.supabaseUrl &&
      env.supabaseAnonKey &&
      !env.supabaseUrl.includes('your-project-ref') &&
      !env.supabaseAnonKey.includes('your-supabase-anon-key')
  );
}

function isAiEngineConfigured() {
  return Boolean(env.aiEngineUrl);
}

module.exports = {
  env,
  isSupabaseConfigured,
  isAiEngineConfigured,
};
