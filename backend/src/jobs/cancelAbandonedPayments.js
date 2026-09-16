const Payment = require('../models/Payment');

let cancelInterval = null;

async function cancelAbandonedPayments() {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const result = await Payment.updateMany(
      { status: 'CREATED', createdAt: { $lt: thirtyMinutesAgo } },
      { $set: { status: 'VOIDED' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Jobs] Auto-canceled ${result.modifiedCount} abandoned payments`);
    }
  } catch (err) {
    console.error('[Jobs] Error canceling abandoned payments:', err.message);
  }
}

function startCancelAbandonedPaymentsJob() {
  if (cancelInterval) return;
  // Run every 5 minutes
  cancelInterval = setInterval(cancelAbandonedPayments, 5 * 60 * 1000);
  // Run once immediately on startup
  cancelAbandonedPayments();
  console.log('[Jobs] Started abandoned payments cancellation job');
}

function stopCancelAbandonedPaymentsJob() {
  if (cancelInterval) {
    clearInterval(cancelInterval);
    cancelInterval = null;
    console.log('[Jobs] Stopped abandoned payments cancellation job');
  }
}

module.exports = {
  startCancelAbandonedPaymentsJob,
  stopCancelAbandonedPaymentsJob
};
