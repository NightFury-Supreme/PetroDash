'use strict';

const { startSyncJob } = require('./syncPendingUsers');
const { startDeletionSyncJob } = require('./syncPendingDeletions');
const { startUpdateSyncJob } = require('./syncPendingUpdates');
const { startQueuedServersJob } = require('./syncQueuedServers');
const { startPruneLogsJob } = require('./pruneAuditLogs');
const { startCancelAbandonedPaymentsJob } = require('./cancelAbandonedPayments');
const { startComplianceJob } = require('./serverComplianceCheck');
const { startServerReconciliationJob } = require('./serverReconciliationJob');
const { startAutoUnsuspendJob } = require('./autoUnsuspendServers');

function startBackgroundJobs() {
  startSyncJob();
  startDeletionSyncJob();
  startUpdateSyncJob();
  startQueuedServersJob();
  startPruneLogsJob();
  startCancelAbandonedPaymentsJob();
  startComplianceJob();
  startServerReconciliationJob();
  startAutoUnsuspendJob();
}

module.exports = {
  startBackgroundJobs,
};
