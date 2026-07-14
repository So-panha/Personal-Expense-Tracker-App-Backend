const crypto = require('crypto');

/**
 * Generate a 6-digit OTP code
 */
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

module.exports = { generateOtp };
