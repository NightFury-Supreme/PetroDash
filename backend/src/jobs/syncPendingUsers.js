const User = require('../models/User');
const UserCreationService = require('../services/userCreation');

/**
 * Background job to synchronize users missing a Pterodactyl panel account.
 * This runs periodically to catch users who registered while the panel was down.
 */
async function syncPendingUsers() {
  try {
    // Find users who don't have a pterodactylUserId or where it is explicitly null
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
      } catch (err) {
        // Individual user sync failure should not stop the loop
        console.error(`Failed to sync pending user ${user.username}:`, err.message);
      }
    }
    
    if (successCount > 0) {
      console.log(`[Job] Synchronized ${successCount}/${pendingUsers.length} pending users to Pterodactyl panel`);
    }

  } catch (err) {
    console.error('[Job] Error running syncPendingUsers job:', err.message);
  }
}

let syncInterval = null;

function startSyncJob() {
  if (syncInterval) return;

  // Run immediately after 10 seconds to catch up on startup
  setTimeout(syncPendingUsers, 10000);

  // Then run every 5 minutes (300,000 ms)
  syncInterval = setInterval(syncPendingUsers, 5 * 60 * 1000);
  console.log('[Job] Started pending users synchronization job (runs every 5 minutes)');
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
