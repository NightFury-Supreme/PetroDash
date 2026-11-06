const PendingDeletion = require('../models/PendingDeletion');
const { forceDeleteServer, deletePanelUser } = require('../services/pterodactyl');

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
        await PendingDeletion.deleteOne({ _id: record._id });
        successCount++;
      } catch (err) {
        if (err.response && err.response.status === 404) {
          await PendingDeletion.deleteOne({ _id: record._id });
          successCount++;
        }
      }
    }
    
    if (successCount > 0) {
      process.stdout.write(`[Job] Synchronized ${successCount}/${pendingDeletions.length} pending deletions from Pterodactyl panel\n`);
    }

  } catch (err) {
    process.stderr.write(`[Job] syncPendingDeletions error: ${err.message}\n`);
  }
}

let syncInterval = null;

function startDeletionSyncJob() {
  if (syncInterval) return;
  setTimeout(syncPendingDeletions, 15000);
  syncInterval = setInterval(syncPendingDeletions, 5 * 60 * 1000);
  process.stdout.write('[Job] Started pending deletions sync worker (runs every 5m)\n');
}

function stopDeletionSyncJob() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    process.stdout.write('[Job] Stopped pending deletions sync worker\n');
  }
}

module.exports = {
  syncPendingDeletions,
  startDeletionSyncJob,
  stopDeletionSyncJob
};
