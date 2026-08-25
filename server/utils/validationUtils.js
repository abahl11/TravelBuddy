// server/utils/validationUtils.js

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => typeof email === 'string' && EMAIL_REGEX.test(email.trim());

/**
 * @param {string} password
 * @returns {{ isValid: boolean, message: string }}
 */
const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  return { isValid: true, message: '' };
};

/**
 * @param {string} email
 * @param {string[]} allowedDomains
 * @returns {boolean}
 */
const isValidUniversityEmail = (email, allowedDomains = []) => {
  if (!isValidEmail(email)) return false;

  const domain = email.trim().toLowerCase().split('@')[1];

  return allowedDomains.some((allowed) => allowed.toLowerCase() === domain);
};

module.exports = { isValidEmail, validatePassword, isValidUniversityEmail, EMAIL_REGEX };
