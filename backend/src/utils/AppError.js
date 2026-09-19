/**
 * Standardized Application Error
 * Complies with ISO/IEC 25010 (Maintainability) and OWASP ASVS V14.2 (Secure Error Handling)
 */
class AppError extends Error {
  /**
   * @param {string} message - Developer-facing message (not shown to user in prod)
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Machine-readable error code (e.g., ERR_USER_NOT_FOUND)
   * @param {Object} [details] - Optional extra context for debugging or specific API format
   */
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERR_INTERNAL_SERVER';
    this.details = details;
    this.isOperational = true; // Identifies known, predictable errors

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
