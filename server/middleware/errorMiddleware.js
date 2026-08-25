// server/middleware/errorMiddleware.js
const ApiError = require('./apiError');

const notFound = (req, res, next) => {
  next(new ApiError(404, `Not found - ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Something went wrong';

  // Malformed ObjectId in a path param or query.
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid id format';
  }

  // Mongoose schema validation.
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Unique index violation.
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `That ${field} is already taken` : 'Duplicate value';
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized, token failed';
  }

  // 5xx means we did not anticipate it — keep the full trace in the server log.
  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'production' ? {} : { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
