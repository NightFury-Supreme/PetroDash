const { writeAudit } = require('./audit');

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function maskSensitive(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (['password', 'passwordHash', 'token', 'apiKey'].includes(k)) {
      clone[k] = '***';
    } else if (v && typeof v === 'object') {
      clone[k] = maskSensitive(v);
    } else {
      clone[k] = v;
    }
  }
  return clone;
}

function auditAuto() {
  return (req, res, next) => {
    if (!MUTATING_METHODS.has(req.method)) return next();
    const started = Date.now();
    const path = req.originalUrl || req.url || '';
    const method = req.method;
    const bodySnapshot = maskSensitive(req.body);
    const chunks = [];
    const origJson = res.json.bind(res);
    res.json = function(data) {
      try {
        chunks.push(JSON.stringify(data));
      } catch (_) {}
      return origJson(data);
    };

    res.on('finish', async() => {
      try {
        const status = res.statusCode;
        // Log only if request reached the server and was not a 5xx
        const resourceType =
          (path.split('?')[0] || '')
            .replace(/^\/api\/?/, '')
            .split('/')
            .slice(0, 2)
            .join('.') || 'api';
        const resourceId =
          req.params?.id || req.params?.serverId || req.params?.userId || undefined;
        const responsePreview = (chunks.join('').slice(0, 500) || '').toString();
        await writeAudit(req, `api.${method.toLowerCase()}`, resourceType, resourceId, {
          path,
          status,
          durationMs: Date.now() - started,
          success: status >= 200 && status < 400,
          body: bodySnapshot,
          method,
          responsePreview,
          category: 'auto'
        });
      } catch (_) {}
    });
    next();
  };
}

module.exports = { auditAuto };
