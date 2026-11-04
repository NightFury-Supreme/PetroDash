const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { getClient, withTimeout } = require('../lib/redis');
const AppError = require('../utils/AppError');

const readyCallbacks = new Set();

function onRedisReady(client, callback) {
  if (!client) return;
  if (client.status === 'ready') {
    callback();
    return;
  }
  readyCallbacks.add(callback);
  if (!client._hasRateLimitReadyHook) {
    client._hasRateLimitReadyHook = true;
    client.on('ready', () => {
      for (const cb of readyCallbacks) {
        try { cb(); } catch (_cbErr) {}
      }
    });
  }
}

class ResilientRateLimitStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:';
    this.redisClient = options.redisClient;
    this.redisStore = null;
    this.isInitialized = false;
    this.memoryRecords = new Map();
    this.windowMs = 60 * 1000;
  }

  async init(options) {
    this.windowMs = options.windowMs || 60 * 1000;
    if (!this.redisClient) return;

    this.redisStore = new RedisStore({
      sendCommand: (...args) => withTimeout(this.redisClient.call(...args), 1500),
      prefix: this.prefix
    });

    const initRedis = async () => {
      try {
        await this.redisStore.init(options);
        this.isInitialized = true;
      } catch (_initErr) {
        this.isInitialized = false;
      }
    };

    onRedisReady(this.redisClient, initRedis);
  }

  async increment(key) {
    if (this.redisStore && this.isInitialized && this.redisClient?.status === 'ready') {
      try {
        return await this.redisStore.increment(key);
      } catch (_incrErr) {}
    }

    const now = Date.now();
    let entry = this.memoryRecords.get(key);
    if (!entry || entry.resetTime.getTime() <= now) {
      entry = { totalHits: 0, resetTime: new Date(now + this.windowMs) };
      this.memoryRecords.set(key, entry);
    }
    entry.totalHits++;

    if (this.memoryRecords.size > 10000) {
      for (const [k, v] of this.memoryRecords.entries()) {
        if (v.resetTime.getTime() <= now) this.memoryRecords.delete(k);
      }
    }

    return { totalHits: entry.totalHits, resetTime: entry.resetTime };
  }

  async decrement(key) {
    if (this.redisStore && this.isInitialized && this.redisClient?.status === 'ready') {
      try {
        return await this.redisStore.decrement(key);
      } catch (_decrErr) {}
    }
    const entry = this.memoryRecords.get(key);
    if (entry && entry.totalHits > 0) entry.totalHits--;
  }

  async resetKey(key) {
    if (this.redisStore && this.isInitialized && this.redisClient?.status === 'ready') {
      try {
        await this.redisStore.resetKey(key);
      } catch (_resetKeyErr) {}
    }
    this.memoryRecords.delete(key);
  }

  async resetAll() {
    if (this.redisStore && this.isInitialized && this.redisClient?.status === 'ready') {
      try {
        await this.redisStore.resetAll();
      } catch (_resetAllErr) {}
    }
    this.memoryRecords.clear();
  }

  async get(key) {
    if (this.redisStore && this.isInitialized && this.redisClient?.status === 'ready') {
      try {
        return await this.redisStore.get(key);
      } catch (_getErr) {}
    }
    const entry = this.memoryRecords.get(key);
    if (!entry || entry.resetTime.getTime() <= Date.now()) return undefined;
    return { totalHits: entry.totalHits, resetTime: entry.resetTime };
  }
}

function createRateLimiter(max, windowMs, options = {}) {
  const { prefix, ...restOptions } = options;
  const redisClient = getClient();
  const defaultPrefix = `rl:${windowMs}:${max}:${Math.random().toString(36).substring(2, 9)}:`;
  const store = new ResilientRateLimitStore({
    redisClient,
    prefix: prefix || defaultPrefix,
  });

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    passOnStoreError: true,
    message: { error: 'Too many requests, please try again later.' },
    handler: (req, res, next) => {
      let retryAfter = Math.ceil(windowMs / 1000);
      if (req.rateLimit && req.rateLimit.resetTime) {
        const resetMs = req.rateLimit.resetTime.getTime() - Date.now();
        retryAfter = Math.max(1, Math.ceil(resetMs / 1000));
      }
      res.set('Retry-After', retryAfter.toString());
      return next(AppError.tooManyRequests('Too many requests, please try again later.', 'ERR_RATE_LIMIT', { retryAfter }));
    },
    ...restOptions
  });
}

function createSecureRateLimiter(max, windowMs, options = {}) {
  const { prefix, ...restOptions } = options;
  const redisClient = getClient();
  const defaultPrefix = `rl_sec:${windowMs}:${max}:${Math.random().toString(36).substring(2, 9)}:`;
  const store = new ResilientRateLimitStore({
    redisClient,
    prefix: prefix || defaultPrefix,
  });

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    passOnStoreError: true,
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
    handler: (req, res, next) => {
      let retryAfter = Math.ceil(windowMs / 1000);
      if (req.rateLimit && req.rateLimit.resetTime) {
        const resetMs = req.rateLimit.resetTime.getTime() - Date.now();
        retryAfter = Math.max(1, Math.ceil(resetMs / 1000));
      }
      res.set('Retry-After', retryAfter.toString());
      return next(AppError.tooManyRequests('Too many requests, please try again later.', 'ERR_RATE_LIMIT', { retryAfter }));
    },
    ...restOptions
  });
}

const verificationRateLimit = createSecureRateLimiter(5, 15 * 60 * 1000);
const passwordResetRateLimit = createSecureRateLimiter(3, 60 * 60 * 1000, { skipSuccessfulRequests: false });
const loginRateLimit = createSecureRateLimiter(10, 15 * 60 * 1000);
const registrationRateLimit = createSecureRateLimiter(3, 60 * 60 * 1000);
const resendRateLimit = createSecureRateLimiter(3, 60 * 60 * 1000, { skipSuccessfulRequests: false });

module.exports = { 
  createRateLimiter,
  createSecureRateLimiter,
  verificationRateLimit,
  passwordResetRateLimit,
  loginRateLimit,
  registrationRateLimit,
  resendRateLimit
};