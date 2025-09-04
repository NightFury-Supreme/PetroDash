const rateLimit = require('express-rate-limit');

function createRateLimiter(max, windowMs) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
}

module.exports = { createRateLimiter };


