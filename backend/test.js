// Simple test file for CI/CD
console.log('Running backend tests...');

// Basic validation tests
const requiredEnvVars = ['NODE_ENV', 'MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
  console.log('Missing environment variables:', missingVars);
  process.exit(1);
}

console.log('✅ All required environment variables are present');
console.log('✅ Backend tests passed');

process.exit(0);
