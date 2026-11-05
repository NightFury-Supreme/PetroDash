const AuditLog = require('../models/AuditLog');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

async function pruneAuditLogs() {
  try {
    const daysToKeep = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const count = await AuditLog.countDocuments({ createdAt: { $lt: cutoffDate } });
    if (count === 0) return;

    const backupDir = path.join(__dirname, '../../backups/logs');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFileName = `audit_logs_${cutoffDate.toISOString().split('T')[0]}.jsonl.gz`;
    const backupFilePath = path.join(backupDir, backupFileName);

    process.stdout.write(`[Job] Starting backup of ${count} audit logs to ${backupFileName}...\n`);

    const cursor = AuditLog.find({ createdAt: { $lt: cutoffDate } }).lean().cursor();
    const gzip = zlib.createGzip();
    const outStream = fs.createWriteStream(backupFilePath);

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
      process.stdout.write(`[Job] Pruned ${result.deletedCount} old audit logs (older than ${daysToKeep} days)\n`);
    }
  } catch (err) {
    process.stderr.write(`[Job] pruneAuditLogs error: ${err.message}\n`);
  }
}

let pruneInterval = null;

function startPruneLogsJob() {
  if (pruneInterval) return;
  setTimeout(pruneAuditLogs, 30000);
  pruneInterval = setInterval(pruneAuditLogs, 24 * 60 * 60 * 1000);
  process.stdout.write('[Job] Started audit logs pruning job\n');
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
