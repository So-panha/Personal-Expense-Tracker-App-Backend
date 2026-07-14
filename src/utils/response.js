/**
 * Standard API response envelope matching the Flutter client contract:
 * { result: "success"|"error", message: "...", data: ... }
 */
function success(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    result: 'success',
    message,
    data,
  });
}

function error(res, message = 'An error occurred', statusCode = 400) {
  return res.status(statusCode).json({
    result: 'error',
    message,
    data: null,
  });
}

module.exports = { success, error };
