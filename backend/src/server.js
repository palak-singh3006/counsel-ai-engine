const createApp = require('./app');
const { env, isSupabaseConfigured, isAiEngineConfigured } = require('./config/env');
const logger = require('./utils/logger');

const app = createApp();

app.listen(env.port, () => {
  logger.info(`Counsel Main Backend listening on port ${env.port}`, {
    env: env.nodeEnv,
    frontendUrl: env.frontendUrl,
    supabaseConfigured: isSupabaseConfigured(),
    aiEngineConfigured: isAiEngineConfigured(),
  });
});
