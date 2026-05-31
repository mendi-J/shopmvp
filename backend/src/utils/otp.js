const crypto = require('crypto');

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const getOTPExpiry = () => {
  return new Date(Date.now() + 5 * 60 * 1000);
};

module.exports = { generateOTP, getOTPExpiry };
