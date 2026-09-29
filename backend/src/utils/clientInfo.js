/**
 * Client Info Resolution Utility
 * 
 * Safely resolves client IP address and User-Agent across proxies, Cloudflare,
 * IPv6 loopbacks, and various Express request environments.
 */

/**
 * Resolves the client's public or normalized IP address from an Express request or metadata.
 * Correctly accounts for Cloudflare, Nginx reverse proxies, IPv6 loopback, and IPv4-mapped IPv6.
 *
 * @param {Object} req - Express request object or mock object
 * @param {Object} [metadata={}] - Optional metadata containing ip
 * @returns {string} Normalized IP address
 */
function resolveClientIp(req, metadata = {}) {
  const cfIp = req?.headers?.['cf-connecting-ip'];
  const realIp = req?.headers?.['x-real-ip'];
  const xForwarded = req?.headers?.['x-forwarded-for'];
  const forwardedIp = Array.isArray(xForwarded) ? xForwarded[0] : xForwarded?.split(',')[0];

  let raw = (cfIp || realIp || forwardedIp)?.trim()
    || req?.ip
    || req?.socket?.remoteAddress
    || req?.connection?.remoteAddress
    || metadata?.ip
    || 'unknown';

  if (typeof raw === 'string') {
    raw = raw.trim();
    if (raw === '::1' || raw === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }
    if (raw.startsWith('::ffff:')) {
      return raw.substring(7);
    }
  }

  return raw || 'unknown';
}

/**
 * Resolves the client's User-Agent string from an Express request or metadata.
 *
 * @param {Object} req - Express request object or mock object
 * @param {Object} [metadata={}] - Optional metadata containing userAgent
 * @returns {string} User-Agent string or 'unknown'
 */
function resolveUserAgent(req, metadata = {}) {
  let ua = null;
  if (typeof req?.get === 'function') {
    try {
      ua = req.get('user-agent');
    } catch {
      // ignore
    }
  }
  if (!ua && typeof req?.header === 'function') {
    try {
      ua = req.header('user-agent');
    } catch {
      // ignore
    }
  }
  if (!ua) {
    ua = req?.headers?.['user-agent']
      || req?.headers?.['User-Agent']
      || req?.userAgent
      || metadata?.userAgent;
  }

  if (typeof ua === 'string') {
    ua = ua.trim();
    if (ua.length > 0) return ua;
  }

  return 'unknown';
}

module.exports = {
  resolveClientIp,
  resolveUserAgent,
};
