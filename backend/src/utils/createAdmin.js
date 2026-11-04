#!/usr/bin/env node
/*
  Promote an existing user to admin or create a new admin user.
  Optionally updates password if ADMIN_PASSWORD is provided.

  Usage examples:
  ADMIN_EMAIL=admin@example.com npm run create-admin
  ADMIN_USERNAME=admin npm run create-admin
  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD="StrongPass123" npm run create-admin
*/
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { connectToDatabase } = require('../lib/mongo');
const User = require('../models/User');

dotenv.config({ path: process.env.ENV_PATH || '.env' });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!email && !username) {
    console.error('Provide ADMIN_EMAIL or ADMIN_USERNAME');
    process.exit(1);
  }

  await connectToDatabase();

  const query = email ? { email: email.toLowerCase().trim() } : { username: username.trim() };
  let user = await User.findOne(query);

  if (!user) {
    if (!password) {
      console.error('User not found. Provide ADMIN_PASSWORD to create a new admin account.');
      process.exit(1);
    }
    const finalEmail = (email || `${username}@example.com`).toLowerCase().trim();
    const finalUsername = (username || email.split('@')[0]).trim();
    const passwordHash = await bcrypt.hash(password, 10);

    user = new User({
      email: finalEmail,
      username: finalUsername,
      firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
      lastName: process.env.ADMIN_LAST_NAME || 'User',
      passwordHash,
      role: 'admin',
      emailVerified: true,
      resources: {
        diskMb: 102400,
        memoryMb: 32768,
        cpuPercent: 400,
        backups: 10,
        databases: 10,
        allocations: 10,
        serverSlots: 10,
      },
    });

    await user.save();
    console.log(`Created new admin user: ${user.username} (${user.email})`);
    process.exit(0);
  }

  let changed = false;
  if (user.role !== 'admin') {
    user.role = 'admin';
    changed = true;
  }
  if (password) {
    user.passwordHash = await bcrypt.hash(password, 10);
    changed = true;
  }

  if (changed) {
    await user.save();
  }

  console.log(`User promoted to admin: ${user.username} (${user.email})${password ? ' and password updated' : ''}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to promote or create admin:', err?.message || err);
  process.exit(1);
});
