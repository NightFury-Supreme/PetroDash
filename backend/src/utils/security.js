const crypto = require('crypto');

/**
 * Generate a cryptographically secure verification code
 * @param {number} length - Length of the code (default: 6)
 * @returns {string} - Secure random code
 */
function generateSecureCode(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const range = max - min + 1;

  // Generate cryptographically secure random number
  const randomBytes = crypto.randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0);
  const normalizedValue = randomValue / 0xffffffff;

  return Math.floor(min + normalizedValue * range).toString();
}

/**
 * Generate a secure random token
 * @param {number} bytes - Number of random bytes (default: 32)
 * @returns {string} - Hex encoded random token
 */
function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Constant-time string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings are equal
 */
function constantTimeCompare(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Hash a string using SHA-256
 * @param {string} input - String to hash
 * @returns {string} - Hex encoded hash
 */
function hashString(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generate a secure salt for password hashing
 * @param {number} bytes - Number of salt bytes (default: 16)
 * @returns {string} - Hex encoded salt
 */
function generateSalt(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid and errors
 */
function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common patterns
  const commonPatterns = [/123456/, /password/i, /qwerty/i, /abc123/i, /admin/i, /letmein/i];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns and is not secure');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if an IP address is in a rate limit window
 * @param {string} ip - IP address
 * @param {string} key - Rate limit key
 * @param {number} windowMs - Window in milliseconds
 * @param {number} maxAttempts - Maximum attempts allowed
 * @returns {object} - Rate limit status
 */
function checkRateLimit(ip, key, windowMs, maxAttempts) {
  // This would typically use Redis or a similar store
  // For now, return a basic structure
  return {
    allowed: true,
    remaining: maxAttempts,
    resetTime: Date.now() + windowMs
  };
}

/**
 * Check if server limits have changed
 * @param {Object} current - Current limits
 * @param {Object} updated - Updated limits
 * @returns {boolean} - True if limits changed
 */
function hasServerLimitsChanged(current, updated) {
  const limitKeys = ['diskMb', 'memoryMb', 'cpuPercent', 'backups', 'databases', 'allocations'];
  return limitKeys.some(key => Number(current?.[key] || 0) !== Number(updated?.[key] || 0));
}

/**
 * Handle Zod validation errors consistently
 * @param {Object} res - Express response object
 * @param {Object} parsed - Zod parsed result
 * @returns {boolean} - True if validation failed (response sent)
 */
function handleValidationError(res, parsed) {
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return true;
  }
  return false;
}

/**
 * Get settings from database (cached for performance)
 * @returns {Promise<Object>} - Settings object
 */
let settingsCache = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getSettings() {
  const now = Date.now();
  if (settingsCache && now - settingsCacheTime < SETTINGS_CACHE_TTL) {
    return settingsCache;
  }

  const Settings = require('../models/Settings');
  settingsCache = await Settings.findOne({}).lean();
  settingsCacheTime = now;
  return settingsCache;
}

/**
 * Send a standardized 500 error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} [details] - Optional error details
 */
function sendServerError(res, message, details = null) {
  const response = { error: message };
  if (details) response.details = details;
  res.status(500).json(response);
}

module.exports = {
  generateSecureCode,
  generateSecureToken,
  constantTimeCompare,
  hashString,
  generateSalt,
  validatePasswordStrength,
  checkRateLimit,
  hasServerLimitsChanged,
  handleValidationError,
  getSettings,
  sendServerError
};
