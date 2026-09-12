const PendingDeletion = require('../models/PendingDeletion');
const { forceDeleteServer, deletePanelUser } = require('../services/pterodactyl');

/**
 * Background job to synchronize pending deletions for Pterodactyl panel.
 * This runs periodically to clean up resources that failed to delete when the panel was down.
 */
async function syncPendingDeletions() {
  try {
    const pendingDeletions = await PendingDeletion.find({});

    if (pendingDeletions.length === 0) {
      return;
    }

    let successCount = 0;
    for (const record of pendingDeletions) {
      try {
        if (record.resourceType === 'server') {
          await forceDeleteServer(record.panelId);
        } else if (record.resourceType === 'user') {
          await deletePanelUser(record.panelId);
        }
        
        // If successful, delete the pending record
        await PendingDeletion.deleteOne({ _id: record._id });
        successCount++;
      } catch (err) {
        // Individual deletion failure should not stop the loop
        // It might fail again if the panel is still down, or if the resource was already deleted.
        // If it was already deleted (404), we should probably clean it up.
        if (err.response && err.response.status === 404) {
          await PendingDeletion.deleteOne({ _id: record._id });
          successCount++;
        } else {
          console.error(`Failed to sync pending deletion for ${record.resourceType} ${record.panelId}:`, err.message);
        }
      }
    }
    
    if (successCount > 0) {
      console.log(`[Job] Synchronized ${successCount}/${pendingDeletions.length} pending deletions from Pterodactyl panel`);
    }

  } catch (err) {
    console.error('[Job] Error running syncPendingDeletions job:', err.message);
  }
}

let syncInterval = null;

function startDeletionSyncJob() {
  if (syncInterval) return;

  // Run immediately after 15 seconds to catch up on startup
  setTimeout(syncPendingDeletions, 15000);

  // Run every 5 minutes
  syncInterval = setInterval(syncPendingDeletions, 5 * 60 * 1000);
  console.log('[Job] Started pending deletions sync worker (runs every 5m)');
}

function stopDeletionSyncJob() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[Job] Stopped pending deletions sync worker');
  }
}

module.exports = {
  syncPendingDeletions,
  startDeletionSyncJob,
  stopDeletionSyncJob
};
