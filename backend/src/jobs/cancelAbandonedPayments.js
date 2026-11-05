const Payment = require('../models/Payment');

let cancelInterval = null;

async function cancelAbandonedPayments() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Payment.updateMany(
      { status: 'CREATED', createdAt: { $lt: twentyFourHoursAgo } },
      { $set: { status: 'VOIDED' } }
    );
    if (result.modifiedCount > 0) {
      process.stdout.write(`[Jobs] Auto-canceled ${result.modifiedCount} abandoned payments\n`);
    }
  } catch (err) {
    process.stderr.write(`[Jobs] cancelAbandonedPayments error: ${err.message}\n`);
  }
}

function startCancelAbandonedPaymentsJob() {
  if (cancelInterval) return;
  cancelInterval = setInterval(cancelAbandonedPayments, 15 * 60 * 1000);
  cancelAbandonedPayments();
  process.stdout.write('[Jobs] Started abandoned payments cancellation job\n');
}

function stopCancelAbandonedPaymentsJob() {
  if (cancelInterval) {
    clearInterval(cancelInterval);
    cancelInterval = null;
    process.stdout.write('[Jobs] Stopped abandoned payments cancellation job\n');
  }
}

module.exports = {
  startCancelAbandonedPaymentsJob,
  stopCancelAbandonedPaymentsJob
};
