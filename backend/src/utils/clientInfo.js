const geoip = require('geoip-lite');
const { getOrSetCache } = require('../lib/redis');

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

function resolveUserAgent(req, metadata = {}) {
  let ua = null;
  if (typeof req?.get === 'function') {
    try {
      ua = req.get('user-agent');
    } catch (_getErr) {}
  }
  if (!ua && typeof req?.header === 'function') {
    try {
      ua = req.header('user-agent');
    } catch (_headerErr) {}
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

function getCountryName(countryCode) {
  if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) {
    return countryCode || '';
  }
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return displayNames.of(countryCode.toUpperCase()) || countryCode;
  } catch (_intlErr) {
    return countryCode;
  }
}

function isPrivateOrLoopbackIp(ip) {
  if (!ip || typeof ip !== 'string') return true;
  const trimmed = ip.trim();
  if (trimmed === '127.0.0.1' || trimmed === '::1' || trimmed === 'localhost' || trimmed === 'unknown') return true;
  if (trimmed.startsWith('10.') || trimmed.startsWith('192.168.') || trimmed.startsWith('169.254.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(trimmed)) return true;
  if (trimmed.startsWith('fc') || trimmed.startsWith('fd') || trimmed.startsWith('fe80:')) return true;
  return false;
}

async function resolveClientLocation(req, explicitIp = null) {
  const cfCity = req?.headers?.['cf-ipcity'];
  const cfRegion = req?.headers?.['cf-region'] || req?.headers?.['cf-region-code'];
  const cfCountry = req?.headers?.['cf-ipcountry'];

  if (cfCountry && typeof cfCountry === 'string' && cfCountry !== 'XX' && cfCountry !== 'T1') {
    const countryName = getCountryName(cfCountry);
    const parts = [cfCity, cfRegion, countryName].filter((p) => p && typeof p === 'string' && p.trim().length > 0);
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }

  const vercelCity = req?.headers?.['x-vercel-ip-city'];
  const vercelRegion = req?.headers?.['x-vercel-ip-country-region'];
  const vercelCountry = req?.headers?.['x-vercel-ip-country'];
  if (vercelCountry && typeof vercelCountry === 'string') {
    const countryName = getCountryName(vercelCountry);
    const parts = [vercelCity, vercelRegion, countryName].filter((p) => p && typeof p === 'string' && p.trim().length > 0);
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }

  const ip = explicitIp || resolveClientIp(req);
  if (!ip || isPrivateOrLoopbackIp(ip)) {
    return 'Local Network';
  }

  const cleanIp = ip.split(',')[0].trim();
  const cacheKey = `geo:ip:${cleanIp}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      let resolvedCountry = '';
      let resolvedRegion = '';
      let resolvedCity = '';

      try {
        const geo = geoip.lookup(cleanIp);
        if (geo && geo.country) {
          resolvedCountry = getCountryName(geo.country);
          resolvedRegion = geo.region || '';
          resolvedCity = geo.city || '';
        }
      } catch (_geoError) {}

      if (!resolvedCity || !resolvedRegion) {
        try {
          const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(cleanIp)}?fields=status,country,regionName,city`, {
            signal: AbortSignal.timeout(1500),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.status === 'success') {
              if (data.city) resolvedCity = data.city;
              if (data.regionName) resolvedRegion = data.regionName;
              if (data.country) resolvedCountry = data.country;
            }
          }
        } catch (_fetchError) {}
      }

      const parts = [resolvedCity, resolvedRegion, resolvedCountry].filter(
        (p) => p && typeof p === 'string' && p.trim().length > 0
      );

      if (parts.length > 0) {
        return parts.join(', ');
      }
      return 'Unknown Location';
    },
    604800
  );
}

module.exports = {
  resolveClientIp,
  resolveUserAgent,
  resolveClientLocation,
};
