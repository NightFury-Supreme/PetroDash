#!/usr/bin/env node
/*
  Create or promote an admin user.
  Usage examples:
    ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD="StrongPass123" node scripts/createAdmin.js
    ADMIN_USERNAME=admin ADMIN_PASSWORD="StrongPass123" node scripts/createAdmin.js
*/

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function main() {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }
  if (!ADMIN_EMAIL && !ADMIN_USERNAME) {
    console.error('Provide ADMIN_EMAIL or ADMIN_USERNAME');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);

  // Lazy-require User model
  const User = require('../src/models/User');

  const query = ADMIN_EMAIL ? { email: ADMIN_EMAIL } : { username: ADMIN_USERNAME };
  let user = await User.findOne(query);

  if (!user) {
    // Create new user
    const email = ADMIN_EMAIL || `${ADMIN_USERNAME}@example.com`;
    const username = ADMIN_USERNAME || (ADMIN_EMAIL ? ADMIN_EMAIL.split('@')[0] : 'admin');
    const hash = ADMIN_PASSWORD ? await bcrypt.hash(ADMIN_PASSWORD, 10) : await bcrypt.hash('admin123', 10);
    user = new User({
      email,
      username,
      firstName: 'Admin',
      lastName: 'User',
      password: hash,
      role: 'admin',
      coins: 0,
      resources: {
        cpuPercent: 0,
        memoryMb: 0,
        diskMb: 0,
        swapMb: -1,
        blockIoProportion: 0,
        cpuPinning: '',
        additionalAllocations: 0,
        databases: 0,
        backups: 0,
        serverSlots: 0,
      },
      serverCount: 0,
    });
    await user.save();
    console.log(`Created admin user: ${username} <${email}>`);
  } else {
    // Promote and optionally set password
    user.role = 'admin';
    if (ADMIN_PASSWORD) {
      user.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
    }
    await user.save();
    console.log(`Updated user '${user.username}': role=admin${ADMIN_PASSWORD ? ', password updated' : ''}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
