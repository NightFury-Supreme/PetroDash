const helmet = require('helmet');

function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "https://cdn.discordapp.com", "https://lh3.googleusercontent.com"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  });
}

function csrfProtection(req, res, next) {
  if (req.path.startsWith('/api/')) {
    return next();
  }
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

function sensitiveOperationLimit() {
  return (req, res, next) => {
    next();
  };
}

function sanitizeInput(req, res, next) {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    let sanitized = str;
    let prev = '';
    while (sanitized !== prev) {
      prev = sanitized;
      const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:', 'blob:'];
      for (const scheme of dangerousSchemes) {
        sanitized = sanitized.replace(new RegExp(scheme, 'gi'), ' ');
      }
      // Remove event handlers - use non-backtracking approach
      sanitized = sanitized.replace(/on[a-z]{1,20}=["'][^"']*["']/gi, ' ');
      sanitized = sanitized.replace(/on[a-z]{1,20}=[^\s>]+/gi, ' ');
      
      // Remove HTML tags - use simple non-backtracking pattern
      sanitized = sanitized.replace(/<[^>]+>/g, ' ');
    }
    return sanitized.trim();
  };

  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    if (typeof obj === 'object') {
      const sanitized = Array.isArray(obj) ? [] : Object.create(null);
      for (const key of Object.keys(obj)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    return obj;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
}

function securityLogging(req, res, next) {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    const safePath = (req.path || '').replace(/[\r\n]/g, '');
    const safeIp = (req.ip || '').replace(/[\r\n]/g, '');
    const safeMethod = (req.method || '').replace(/[\r\n]/g, '');
    console.log(`[${level}] ${safeMethod} ${safePath} ${res.statusCode} ${duration}ms - ${safeIp}`);
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
