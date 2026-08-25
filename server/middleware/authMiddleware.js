// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('./apiError');
const asyncHandler = require('./asyncHandler');

const readToken = (req) => {
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim() || null;
  }

  return null;
};

/** Rejects the request unless it carries a valid token for an existing user. */
const protect = asyncHandler(async (req, res, next) => {
  const token = readToken(req);

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');

  // The account can be deleted while a signed token is still in the wild.
  if (!user) {
    throw new ApiError(401, 'Not authorized, user no longer exists');
  }

  req.user = user;
  next();
});

/**
 * Populates req.user when a valid token is present but never rejects, so public
 * endpoints can tailor their response to the viewer.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = readToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      req.user = null;
    }
  }

  next();
});

module.exports = { protect, optionalAuth };
