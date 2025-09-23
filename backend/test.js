// Simple test file for CI/CD
console.log('Running backend tests...');

// Test utilities
function runTest(testName, testFn) {
  try {
    const result = testFn();
    if (result) {
      console.log(`✅ ${testName}`);
      return true;
    } else {
      console.log(`❌ ${testName}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${testName}: ${error.message}`);
    return false;
  }
}

let allTestsPassed = true;

// Environment variable tests
const requiredEnvVars = ['NODE_ENV', 'MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
  console.log('⚠️  Missing environment variables for full testing:', missingVars);
  console.log('Skipping tests that require environment variables...');
} else {
  allTestsPassed &= runTest('Environment variables are present', () => {
    return requiredEnvVars.every(key => process.env[key]);
  });
}

// Module loading tests
allTestsPassed &= runTest('Core modules can be imported', () => {
  try {
    require('./src/utils/security');
    require('./src/middleware/auth');
    return true;
  } catch (error) {
    return false;
  }
});

// Security utility tests
allTestsPassed &= runTest('Security utilities function correctly', () => {
  const { generateSecureCode, hashString } = require('./src/utils/security');
  
  // Test secure code generation
  const code1 = generateSecureCode(10);
  const code2 = generateSecureCode(10);
  if (code1.length !== 10 || code2.length !== 10 || code1 === code2) {
    return false;
  }
  
  // Test string hashing
  const testString = 'testString123';
  const hashed = hashString(testString);
  if (!hashed || hashed === testString || hashed.length === 0) {
    return false;
  }
  
  return true;
});

// Rate limiting tests
allTestsPassed &= runTest('Rate limiting middleware loads correctly', () => {
  const { createRateLimiter } = require('./src/middleware/rateLimit');
  const limiter = createRateLimiter(100, 60000);
  return typeof limiter === 'function';
});

// Configuration validation
allTestsPassed &= runTest('Configuration values are valid', () => {
  const port = process.env.PORT || 4000;
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  return !isNaN(port) && ['development', 'production', 'test'].includes(nodeEnv);
});

if (allTestsPassed) {
  console.log('✅ All backend tests passed');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
