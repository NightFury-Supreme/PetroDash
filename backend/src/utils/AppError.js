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

  static badRequest(message, code = 'ERR_BAD_REQUEST', details = null) {
    return new AppError(message, 400, code, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'ERR_UNAUTHORIZED', details = null) {
    return new AppError(message, 401, code, details);
  }

  static forbidden(message = 'Forbidden', code = 'ERR_FORBIDDEN', details = null) {
    return new AppError(message, 403, code, details);
  }

  static notFound(message = 'Not Found', code = 'ERR_NOT_FOUND', details = null) {
    return new AppError(message, 404, code, details);
  }

  static conflict(message = 'Conflict', code = 'ERR_CONFLICT', details = null) {
    return new AppError(message, 409, code, details);
  }

  static internal(message = 'Internal Server Error', code = 'ERR_INTERNAL_SERVER', details = null) {
    return new AppError(message, 500, code, details);
  }
}

module.exports = AppError;
