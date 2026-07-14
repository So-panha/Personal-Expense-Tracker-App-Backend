const { error } = require('../utils/response');

/**
 * Global error handler middleware.
 */
function errorHandler(err, req, res, next) {
  console.error('Unhandled Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return error(res, message, statusCode);
}

module.exports = { errorHandler };
