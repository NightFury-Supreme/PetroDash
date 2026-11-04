function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return Math.max(min, Math.min(max, i));
}

function getEarnConfig(settings) {
  const earn = settings?.earn || {};
  const normalizeMethod = (m, defaults) => {
    const obj = m || {};
    return {
      enabled: Boolean(obj.enabled),
      coins: clampInt(obj.coins, 0, 1000000, defaults.coins),
      cooldownSeconds: clampInt(obj.cooldownSeconds, 0, 86400, defaults.cooldownSeconds),
      waitSeconds: clampInt(obj.waitSeconds, 0, 3600, defaults.waitSeconds),
      maxClaimsPerDay: clampInt(obj.maxClaimsPerDay, 0, 1000, defaults.maxClaimsPerDay),
      url: typeof obj.url === 'string' ? obj.url : defaults.url,
      antiBypassToken: typeof obj.antiBypassToken === 'string' ? obj.antiBypassToken : defaults.antiBypassToken,
    };
  };

  return {
    linkvertise: normalizeMethod(earn.linkvertise, {
      coins: 20,
      cooldownSeconds: 3600,
      waitSeconds: 10,
      maxClaimsPerDay: 24,
      url: '',
      antiBypassToken: '',
    }),
  };
}

module.exports = {
  startOfUtcDay,
  clampInt,
  getEarnConfig,
};
