const PendingUpdate = require('../models/PendingUpdate');
const { updatePanelUser } = require('../services/pterodactyl');

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
        await PendingUpdate.deleteOne({ _id: record._id });
        successCount++;
      } catch (err) {
        if (err.response && err.response.status === 404) {
          await PendingUpdate.deleteOne({ _id: record._id });
          successCount++;
        }
      }
    }
    
    if (successCount > 0) {
      process.stdout.write(`[Job] Synchronized ${successCount}/${pendingUpdates.length} pending updates to Pterodactyl panel\n`);
    }

  } catch (err) {
    process.stderr.write(`[Job] syncPendingUpdates error: ${err.message}\n`);
  }
}

let syncInterval = null;

function startUpdateSyncJob() {
  if (syncInterval) return;
  setTimeout(syncPendingUpdates, 20000);
  syncInterval = setInterval(syncPendingUpdates, 5 * 60 * 1000);
  process.stdout.write('[Job] Started pending updates sync worker (runs every 5m)\n');
}

function stopUpdateSyncJob() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    process.stdout.write('[Job] Stopped pending updates sync worker\n');
  }
}

module.exports = {
  syncPendingUpdates,
  startUpdateSyncJob,
  stopUpdateSyncJob
};
