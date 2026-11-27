const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { env, isSupabaseConfigured, isAiEngineConfigured } = require('./config/env');
const { sendSuccess } = require('./utils/apiResponse');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const aiEngineService = require('./services/aiEngineService');

function createApp() {
  const app = express();

  const allowedOrigins = env.frontendUrl
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    })
  );

  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  const healthHandler = async (_req, res) => {
    let aiEngineStatus = isAiEngineConfigured() ? 'configured' : 'not_configured';
    let aiEngineDetails = null;

    if (isAiEngineConfigured()) {
      try {
        aiEngineDetails = await aiEngineService.checkAiEngineHealth();
        aiEngineStatus = 'healthy';
      } catch {
        aiEngineStatus = 'unreachable';
      }
    }

    return sendSuccess(
      res,
      {
        status: 'healthy',
        service: 'Counsel Main Backend',
        version: '1.0.0',
        supabase: isSupabaseConfigured() ? 'configured' : 'not_configured',
        aiEngine: aiEngineStatus,
        aiEngineDetails,
        timestamp: new Date().toISOString(),
      },
      'Counsel backend is running'
    );
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
