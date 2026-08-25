// server/middleware/adminMiddleware.js
const ApiError = require('./apiError');

/** Must run after `protect`, which is what sets req.user. */
const admin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return next(new ApiError(403, 'Not authorized as admin'));
  }

  next();
};

module.exports = { admin };
