// server/middleware/validateObjectId.js
const mongoose = require('mongoose');
const ApiError = require('./apiError');

/**
 * Rejects a malformed id with a 400 before it reaches the database, so a typo
 * in a URL does not surface as a 500.
 */
const validateObjectId = (...paramNames) => (req, res, next) => {
  for (const name of paramNames) {
    const value = req.params[name];

    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      return next(new ApiError(400, `Invalid ${name}`));
    }
  }

  next();
};

module.exports = validateObjectId;
