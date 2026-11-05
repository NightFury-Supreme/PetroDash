const User = require('../models/User');
const UserCreationService = require('../services/userCreation');

async function syncPendingUsers() {
  try {
    const pendingUsers = await User.find({
      $or: [
        { pterodactylUserId: { $exists: false } },
        { pterodactylUserId: null }
      ]
    });

    if (pendingUsers.length === 0) {
      return;
    }

    let successCount = 0;
    for (const user of pendingUsers) {
      try {
        await UserCreationService.createPterodactylUser(user);
        if (user.pterodactylUserId) {
          successCount++;
        }
      } catch (createError) {
        process.stderr.write(`[Job] Failed to sync pending user ${user.publicId}: ${createError.message}\n`);
      }
    }
    
    if (successCount > 0) {
      process.stdout.write(`[Job] Synchronized ${successCount}/${pendingUsers.length} pending users to Pterodactyl panel\n`);
    }

  } catch (err) {
    process.stderr.write(`[Job] syncPendingUsers error: ${err.message}\n`);
  }
}

let syncInterval = null;

function startSyncJob() {
  if (syncInterval) return;
  setTimeout(syncPendingUsers, 10000);
  syncInterval = setInterval(syncPendingUsers, 5 * 60 * 1000);
  process.stdout.write('[Job] Started pending users synchronization job (runs every 5 minutes)\n');
}

function stopSyncJob() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

module.exports = {
  syncPendingUsers,
  startSyncJob,
  stopSyncJob
};
