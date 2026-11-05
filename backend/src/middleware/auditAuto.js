const { writeAudit } = require('./audit');

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function maskSensitive(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  try {
    return JSON.parse(JSON.stringify(obj, (k, v) => {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') return undefined;
      if (['password', 'passwordHash', 'token', 'apiKey'].includes(k)) return '***';
      if (typeof v === 'string' && v.length > 5000) return v.substring(0, 5000) + '... [TRUNCATED]';
      return v;
    }));
  } catch (_err) {
    return {};
  }
}

function auditAuto() {
  return (req, res, next) => {
    if (!MUTATING_METHODS.has(req.method)) return next();
    const started = Date.now();
    const path = req.originalUrl || req.url || '';
    const method = req.method;
    const bodySnapshot = maskSensitive(req.body);
    let chunks = [];
    const origJson = res.json.bind(res);
    res.json = function (data) {
      try { chunks.push(JSON.stringify(data)); } catch (_jsonErr) {}
      return origJson(data);
    };

    res.on('finish', async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 10));
        
        if (req._auditLogged) return;
        
        const status = res.statusCode;
        const cleanPath = (path.split('?')[0] || '').replace(/^\/api\/?/, '');
        const pathSegments = cleanPath.split('/').filter(Boolean);
        
        const actionSegments = pathSegments.filter(seg => !/^[a-z]{3,4}_[0-9a-f]{20}$/i.test(seg));
        const smartAction = actionSegments.join('.') || `api.${method.toLowerCase()}`;
        
        const resourceType = actionSegments[0] || 'system';
        const resourceId = req.params?.id || req.params?.serverId || req.params?.userId || undefined;
        
        const responsePreview = (chunks.join('').slice(0, 500) || '').toString();
        let severity = 'INFO';
        if (status >= 400 && status < 500) severity = 'WARNING';
        if (status >= 500) severity = 'ERROR';
        
        await writeAudit(req, smartAction, resourceType, resourceId, {
          path,
          status,
          durationMs: Date.now() - started,
          success: status >= 200 && status < 400,
          body: bodySnapshot,
          method,
          responsePreview,
          severity,
          requestId: req.requestId
        });
       
      } catch (_auditErr) {}
    });
    next();
  };
}

module.exports = { auditAuto };
