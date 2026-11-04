class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERR_INTERNAL_SERVER';
    this.details = details;
    this.isOperational = true;

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

  static tooManyRequests(message = 'Too Many Requests', code = 'ERR_RATE_LIMIT', details = null) {
    return new AppError(message, 429, code, details);
  }

  static internal(message = 'Internal Server Error', code = 'ERR_INTERNAL_SERVER', details = null) {
    return new AppError(message, 500, code, details);
  }

  static serviceUnavailable(message = 'Service Unavailable', code = 'ERR_SERVICE_UNAVAILABLE', details = null) {
    return new AppError(message, 503, code, details);
  }
}

module.exports = AppError;
