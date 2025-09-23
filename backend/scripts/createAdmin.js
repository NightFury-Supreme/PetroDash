#!/usr/bin/env node
/*
  Promote an existing user to admin (by email or username).
  Will NOT create users. Optionally updates password if ADMIN_PASSWORD is provided.

  Usage examples:
  ADMIN_EMAIL=admin@example.com npm run create-admin
  ADMIN_USERNAME=admin npm run create-admin
  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD="StrongPass123" npm run create-admin
*/
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { connectToDatabase } = require('../src/lib/mongo');
const User = require('../src/models/User');

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

  const query = email ? { email } : { username };
  const user = await User.findOne(query);

  if (!user) {
    console.error('User not found. Provide an existing user email or username.');
    process.exit(1);
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

  console.log(
    `User promoted to admin: ${user.username} (${user.email})${password ? ' and password updated' : ''}`
  );
  process.exit(0);
}

main().catch(err => {
  console.error('Failed to promote admin:', err?.message || err);
  process.exit(1);
});
