// server/server.js
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const { ensureIndexes } = connectDB;
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiters');

const userRoutes = require('./routes/userRoutes');
const journeyRoutes = require('./routes/journeyRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const universityRoutes = require('./routes/universityRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const geocodeRoutes = require('./routes/geocodeRoutes');
const configRoutes = require('./routes/configRoutes');

const PORT = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Fail at boot rather than at the first request that needs them.
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
  console.error('Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}

if (isProduction && process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters in production.');
  process.exit(1);
}

const app = express();

// Render terminates TLS at its proxy; without this, rate limiting and secure
// cookies see the proxy instead of the caller.
app.set('trust proxy', 1);

app.use(
  helmet({
    // The SPA loads Google Fonts and MapTiler tiles from their CDNs, which
    // helmet's default CSP would block.
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

// In the single-service deployment the client is same-origin, so CORS only
// matters when a separate front end is pointed at this API.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);

app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    database: states[mongoose.connection.readyState] ?? 'unknown',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiLimiter);
app.use('/api/users', userRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/config', configRoutes);

// --- Serve the built React app from this same service ---------------------
// One Render URL: /api/* is the API, everything else is the SPA.
const clientBuildPath = path.resolve(__dirname, '..', 'client', 'build');
const indexHtmlPath = path.join(clientBuildPath, 'index.html');
const hasClientBuild = fs.existsSync(indexHtmlPath);

if (hasClientBuild) {
  app.use(
    express.static(clientBuildPath, {
      // Hashed asset filenames can be cached hard; index.html must not be.
      maxAge: isProduction ? '1y' : 0,
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    })
  );
}

// Unmatched /api paths are a 404 from the API, not the SPA shell.
app.use('/api', notFound);

if (hasClientBuild) {
  // Client-side routing: hand any other GET back to index.html. Registered as
  // middleware rather than app.get('*') because Express 5 rejects a bare '*'.
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();

    // This path bypasses express.static, so the no-cache header has to be set
    // here too — otherwise a cached shell keeps pointing at the previous
    // deploy's hashed bundles after a release.
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexHtmlPath, (error) => {
      if (error) next(error);
    });
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'Travel Buddy API is running. The client build was not found.',
      hint: 'Run `npm run build` at the repo root to build the React app.',
    });
  });
}

app.use(notFound);
app.use(errorHandler);

// --- Boot -----------------------------------------------------------------
let server;

const start = async () => {
  try {
    await connectDB();
    await ensureIndexes();
  } catch (error) {
    console.error(`Could not connect to MongoDB: ${error.message}`);
    process.exit(1);
  }

  server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    console.log(hasClientBuild ? 'Serving the React build from /' : 'No client build found — API only.');
  });
};

const shutdown = (signal) => async () => {
  console.log(`${signal} received, shutting down.`);

  // Stop accepting connections, then close the DB, so in-flight requests finish.
  server?.close(async () => {
    await mongoose.connection.close(false);
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

start();

module.exports = app;
