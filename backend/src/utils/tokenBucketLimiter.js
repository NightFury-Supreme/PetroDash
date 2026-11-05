const AppError = require('./AppError');

class TokenBucketLimiter {
  constructor(options = {}) {
    this.capacity = options.capacity || 180;
    this.refillRate = options.refillRate || 3;
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }

  _refill() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    if (elapsedSeconds > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + elapsedSeconds * this.refillRate);
      this.lastRefill = now;
    }
  }

  tryConsume(count = 1) {
    this._refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }

  async acquire(count = 1) {
    if (this.tryConsume(count)) {
      return true;
    }
    const needed = Math.max(1, count - this.tokens);
    const waitMs = Math.min(Math.ceil((needed / this.refillRate) * 1000), 2000);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    this._refill();
    if (this.tryConsume(count)) {
      return true;
    }
    throw AppError.tooManyRequests('External service rate limit exceeded', 'ERR_PANEL_RATE_LIMITED');
  }
}

module.exports = TokenBucketLimiter;
