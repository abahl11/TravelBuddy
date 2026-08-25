// server/middleware/rateLimiters.js
const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Login and registration are the endpoints worth brute-forcing, so they get a
 * much tighter budget than the rest of the API. Disabled outside production so
 * local testing never locks itself out.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction,
  message: { message: 'Too many requests. Please slow down.' },
});

/**
 * Autocomplete fires per keystroke, so it needs a far higher ceiling than the
 * rest of the API — but still a ceiling, because every miss costs upstream
 * geocoding quota.
 */
const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction,
  message: { message: 'Too many location searches. Please slow down.' },
});

module.exports = { authLimiter, apiLimiter, geocodeLimiter };
