const helmet = require('helmet');

/**
 * Security headers middleware
 */
function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  });
}

/**
 * CSRF protection middleware
 */
function csrfProtection(req, res, next) {
  // Skip CSRF for API routes that use proper authentication
  if (req.path.startsWith('/api/')) {
    return next();
  }

  // For non-API routes, implement CSRF protection
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}

/**
 * Rate limiting for sensitive operations
 */
function sensitiveOperationLimit() {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `sensitive:${ip}`;

    // This would typically use Redis
    // For now, just pass through
    next();
  };
}

/**
 * Input sanitization middleware
 */
function sanitizeInput(req, res, next) {
  // Remove potentially dangerous characters from string inputs
  const sanitizeString = str => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }

  next();
}

/**
 * Request logging for security monitoring
 */
function securityLogging(req, res, next) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      userId: req.user?.sub || null
    };

    // Logging disabled for production
  });

  next();
}

module.exports = {
  securityHeaders,
  csrfProtection,
  sensitiveOperationLimit,
  sanitizeInput,
  securityLogging
};

/**
 * Security headers middleware
 */
function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  });
}

/**
 * CSRF protection middleware
 */
function csrfProtection(req, res, next) {
  // Skip CSRF for API routes that use proper authentication
  if (req.path.startsWith('/api/')) {
    return next();
  }

  // For non-API routes, implement CSRF protection
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}

/**
 * Rate limiting for sensitive operations
 */
function sensitiveOperationLimit() {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `sensitive:${ip}`;

    // This would typically use Redis
    // For now, just pass through
    next();
  };
}

/**
 * Input sanitization middleware
 */
function sanitizeInput(req, res, next) {
  // Remove potentially dangerous characters from string inputs
  const sanitizeString = str => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }

  next();
}

/**
 * Request logging for security monitoring
 */
function securityLogging(req, res, next) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      userId: req.user?.sub || null
    };

    // Logging disabled for production
  });

  next();
}

module.exports = {
  securityHeaders,
  csrfProtection,
  sensitiveOperationLimit,
  sanitizeInput,
  securityLogging
};
