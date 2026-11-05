const { reconcileAllServersWithPanel } = require('../utils/serverReconciler');
const { acquireLock, releaseLock } = require('../lib/redis');

const LOCK_KEY = 'job:server_reconcile';
const LOCK_TTL_MS = 110000;
const RECONCILIATION_INTERVAL_MS = 2 * 60 * 1000;

let reconciliationInterval = null;

async function runServerReconciliationJob() {
  const lockToken = await acquireLock(LOCK_KEY, LOCK_TTL_MS);
  if (!lockToken) {
    return;
  }

  try {
    await reconcileAllServersWithPanel();
  } catch (err) {
    process.stderr.write(`[ServerReconciliationJob] Execution error: ${err.message}\n`);
  } finally {
    await releaseLock(LOCK_KEY, lockToken);
  }
}

function startServerReconciliationJob() {
  if (reconciliationInterval) return;
  setTimeout(runServerReconciliationJob, 15000);
  reconciliationInterval = setInterval(runServerReconciliationJob, RECONCILIATION_INTERVAL_MS);
}

function stopServerReconciliationJob() {
  if (reconciliationInterval) {
    clearInterval(reconciliationInterval);
    reconciliationInterval = null;
  }
}

module.exports = {
  runServerReconciliationJob,
  startServerReconciliationJob,
  stopServerReconciliationJob,
};
