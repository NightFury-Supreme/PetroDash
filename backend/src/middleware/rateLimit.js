const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { getClient } = require('../lib/redis');

function createRateLimiter(max, windowMs, options = {}) {
  const redisClient = getClient();
  const defaultPrefix = `rl:${windowMs}:${max}:${Math.random().toString(36).substring(2, 9)}:`;
  const store = redisClient 
    ? new RedisStore({ 
        sendCommand: (...args) => redisClient.call(...args),
        prefix: options.prefix || defaultPrefix
      })
    : undefined;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    skip: () => process.env.NODE_ENV === 'development',
    message: { error: 'Too many requests, please try again later.' },
    ...options
  });
}

/**
 * Create a strict rate limiter for authentication endpoints
 */
function createSecureRateLimiter(max, windowMs, options = {}) {
  const redisClient = getClient();
  const defaultPrefix = `rl_sec:${windowMs}:${max}:${Math.random().toString(36).substring(2, 9)}:`;
  const store = redisClient 
    ? new RedisStore({ 
        sendCommand: (...args) => redisClient.call(...args),
        prefix: options.prefix || defaultPrefix
      })
    : undefined;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    skip: () => process.env.NODE_ENV === 'development',
    message: { 
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
    keyGenerator: (req) => {
      const ip = ipKeyGenerator(req);
      const userAgent = req.get('User-Agent') || 'unknown';
      return `${ip}:${userAgent}`;
    },
    handler: (req, res) => {
      const retryAfter = Math.ceil(windowMs / 1000);
      res.set('Retry-After', retryAfter.toString());
      res.status(429).json({
        error: 'Too many requests, please try again later.',
        retryAfter,
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      });
    },
    ...options
  });
}

// Pre-configured rate limiters for auth endpoints
const verificationRateLimit = createSecureRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const passwordResetRateLimit = createSecureRateLimiter(3, 60 * 60 * 1000, { skipSuccessfulRequests: false }); // 3 attempts per hour
const loginRateLimit = createSecureRateLimiter(10, 15 * 60 * 1000); // 10 attempts per 15 minutes
const registrationRateLimit = createSecureRateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour
const resendRateLimit = createSecureRateLimiter(3, 60 * 60 * 1000, { skipSuccessfulRequests: false }); // 3 attempts per hour

module.exports = { 
  createRateLimiter,
  createSecureRateLimiter,
  verificationRateLimit,
  passwordResetRateLimit,
  loginRateLimit,
  registrationRateLimit,
  resendRateLimit
};