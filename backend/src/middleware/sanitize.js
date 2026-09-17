function sanitizeValue(value) {
  try {
    return JSON.parse(JSON.stringify(value, (k, v) => {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') return undefined;
      if (k.includes('$') || k.includes('.')) return undefined; // Mitigate NoSQL injections
      return v;
    }));
  } catch {
    return value;
  }
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


