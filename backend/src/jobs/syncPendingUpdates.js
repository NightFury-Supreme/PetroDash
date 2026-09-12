const PendingUpdate = require('../models/PendingUpdate');
const { updatePanelUser } = require('../services/pterodactyl');

/**
 * Background job to synchronize pending profile updates for Pterodactyl panel.
 * This runs periodically to push changes (email, username, name) that failed 
 * when the panel was down.
 */
async function syncPendingUpdates() {
  try {
    const pendingUpdates = await PendingUpdate.find({});

    if (pendingUpdates.length === 0) {
      return;
    }

    let successCount = 0;
    for (const record of pendingUpdates) {
      try {
        const payload = JSON.parse(record.payload);
        await updatePanelUser(record.pterodactylUserId, payload);
        
        // If successful, delete the pending record
        await PendingUpdate.deleteOne({ _id: record._id });
        successCount++;
      } catch (err) {
        // Individual update failure should not stop the loop
        // If it was already deleted (404), we should clean it up.
        if (err.response && err.response.status === 404) {
          await PendingUpdate.deleteOne({ _id: record._id });
          successCount++;
        } else {
          console.error(`Failed to sync pending update for user ${record.pterodactylUserId}:`, err.message);
        }
      }
    }
    
    if (successCount > 0) {
      console.log(`[Job] Synchronized ${successCount}/${pendingUpdates.length} pending updates to Pterodactyl panel`);
    }

  } catch (err) {
    console.error('[Job] Error running syncPendingUpdates job:', err.message);
  }
}

let syncInterval = null;

function startUpdateSyncJob() {
  if (syncInterval) return;

  // Run immediately after 20 seconds to catch up on startup
  setTimeout(syncPendingUpdates, 20000);

  // Run every 5 minutes
  syncInterval = setInterval(syncPendingUpdates, 5 * 60 * 1000);
  console.log('[Job] Started pending updates sync worker (runs every 5m)');
}

function stopUpdateSyncJob() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[Job] Stopped pending updates sync worker');
  }
}

module.exports = {
  syncPendingUpdates,
  startUpdateSyncJob,
  stopUpdateSyncJob
};
