// backend/src/utils/tokenUtils.js
const jwt = require('jsonwebtoken');
const config = require('../config'); // Imports from backend/src/config/index.js

const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    // console.error('Token verification failed:', error.message);
    return null; // Or throw an error if you prefer to handle it differently
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
