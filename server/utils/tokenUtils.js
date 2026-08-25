// server/utils/tokenUtils.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '30d';

/**
 * @param {string} id - User id to embed in the token.
 * @returns {string} Signed JWT.
 */
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });

/** @returns {string} Random token for email verification. */
const generateVerificationToken = () => crypto.randomBytes(32).toString('hex');

/** @returns {string} Random token for a password reset. */
const generateResetToken = () => crypto.randomBytes(20).toString('hex');

module.exports = { generateToken, generateVerificationToken, generateResetToken };
