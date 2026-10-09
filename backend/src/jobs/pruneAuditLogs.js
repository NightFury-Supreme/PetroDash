const AuditLog = require('../models/AuditLog');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

/**
 * Background job to permanently delete audit logs older than a specific threshold (90 days).
 * This prevents the MongoDB database from growing infinitely and slowing down queries.
 */
async function pruneAuditLogs() {
  try {
    const daysToKeep = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Count first to avoid creating empty files
    const count = await AuditLog.countDocuments({ createdAt: { $lt: cutoffDate } });
    if (count === 0) return;

    const backupDir = path.join(__dirname, '../../backups/logs');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFileName = `audit_logs_${cutoffDate.toISOString().split('T')[0]}.jsonl.gz`;
    const backupFilePath = path.join(backupDir, backupFileName);

    console.log(`[Job] Starting backup of ${count} audit logs to ${backupFileName}...`);

    // Use cursor streaming to avoid Out-Of-Memory (OOM) crashes on huge databases
    const cursor = AuditLog.find({ createdAt: { $lt: cutoffDate } }).lean().cursor();
    const gzip = zlib.createGzip();
    const outStream = fs.createWriteStream(backupFilePath);

    // Custom transform to stringify each document into JSON Lines format
    const { Transform } = require('stream');
    const jsonlStringify = new Transform({
      objectMode: true,
      transform(doc, encoding, callback) {
        callback(null, JSON.stringify(doc) + '\n');
      }
    });

    await pipelineAsync(cursor, jsonlStringify, gzip, outStream);

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    if (result.deletedCount > 0) {
      console.log(`[Job] Pruned ${result.deletedCount} old audit logs (older than ${daysToKeep} days)`);
    }
  } catch (err) {
    console.error('[Job] Error running pruneAuditLogs job:', err.message);
  }
}

let pruneInterval = null;

function startPruneLogsJob() {
  if (pruneInterval) return;

  // Run shortly after startup (30 seconds) to clean up immediately if needed
  setTimeout(pruneAuditLogs, 30000);

  // Then run every 24 hours
  pruneInterval = setInterval(pruneAuditLogs, 24 * 60 * 60 * 1000);
  console.log('[Job] Started audit logs pruning job (runs every 24 hours, retains 90 days)');
}

function stopPruneLogsJob() {
  if (pruneInterval) {
    clearInterval(pruneInterval);
    pruneInterval = null;
  }
}

module.exports = {
  pruneAuditLogs,
  startPruneLogsJob,
  stopPruneLogsJob
};
