function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(value)) {
      // Drop keys with Mongo operator characters to mitigate NoSQL injections
      if (k.includes('$') || k.includes('.')) continue;
      result[k] = sanitizeValue(v);
    }
    return result;
  }
  return value;
}

function sanitize(req, _res, next) {
  try {
    if (req.body) req.body = sanitizeValue(req.body);
    if (req.query) req.query = sanitizeValue(req.query);
    if (req.params) req.params = sanitizeValue(req.params);
  } catch (_) {}
  next();
}

module.exports = { sanitize };


