function validateEnv() {
  const get = (key) => process.env[key];
  
  // Skip validation in test environment
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // Required group 1: authentication and core keys
  const authAndCore = ['JWT_SECRET', 'PTERO_APP_API_KEY'];
  const missingAuthAndCore = authAndCore.filter((k) => !get(k) || String(get(k)).trim() === '');
  if (missingAuthAndCore.length > 0) {
    throw new Error(`Missing required auth/core env vars: ${missingAuthAndCore.join(', ')}`);
  }

  // Required group 2: database URL (support either MONGODB_URI or MONGO_URI)
  const mongoUri = get('MONGODB_URI') || get('MONGO_URI');
  if (!mongoUri || String(mongoUri).trim() === '') {
    throw new Error('Missing database connection string: set MONGODB_URI (preferred) or MONGO_URI');
  }

  // Required group 3: server/runtime
  const runtime = ['PORT', 'FRONTEND_URL', 'PTERO_BASE_URL'];
  const missingRuntime = runtime.filter((k) => !get(k) || String(get(k)).trim() === '');
  if (missingRuntime.length > 0) {
    throw new Error(`Missing required runtime env vars: ${missingRuntime.join(', ')}`);
  }

  // Value validation
  // URLs
  validateUrl('PTERO_BASE_URL', get('PTERO_BASE_URL'));
  validateUrl('FRONTEND_URL', get('FRONTEND_URL'));

  // Integers
  validatePositiveInteger('PORT', get('PORT'));
}

function validateUrl(name, value) {
  try {
    // eslint-disable-next-line no-new
    new URL(String(value));
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
}

function validatePositiveInteger(name, value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
}

module.exports = { validateEnv };

