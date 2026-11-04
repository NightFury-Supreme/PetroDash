'use strict';

const Server = require('../models/Server');
const User = require('../models/User');
const { unsuspendServer, updateServerDetails } = require('../services/pterodactyl');
const { invalidateServerCaches } = require('../utils/serverCacheInvalidation');
const { invalidateUserCaches } = require('../utils/userCacheInvalidation');
const { publishEvent } = require('../lib/redis');
const { writeAudit } = require('../middleware/audit');

async function runAutoUnsuspendSweep() {
  try {
    const now = new Date();
    const expiredServers = await Server.find({
      status: 'suspended',
      suspendedUntil: { $ne: null, $lte: now },
    }).populate('owner', 'publicId pterodactylUserId');

    if (!expiredServers || expiredServers.length === 0) {
      return;
    }

    for (const server of expiredServers) {
      try {
        if (server.panelServerId && server.owner?.pterodactylUserId) {
          await unsuspendServer(server.panelServerId);
          await updateServerDetails(server.panelServerId, {
            name: server.name,
            user: server.owner.pterodactylUserId,
            description: '',
          });
        }

        server.status = 'active';
        server.suspended = false;
        server.suspendedUntil = null;
        server.suspensionReason = null;
        await server.save();

        const publicServerId = server.publicId;
        const ownerPublicId = server.owner?.publicId;

        if (ownerPublicId) {
          await invalidateServerCaches({ userId: ownerPublicId, publicServerId });
          await invalidateUserCaches(ownerPublicId);
          await publishEvent(`user:${ownerPublicId}:servers`, { type: 'SERVER_ACTIVE', serverId: publicServerId });
        }

        await writeAudit('system', 'server.unsuspend', 'server', publicServerId, {
          serverName: server.name,
          panelServerId: server.panelServerId,
          targetUserId: ownerPublicId,
          userId: ownerPublicId,
          status: 'active',
          source: 'auto_unsuspend_job',
          changes: {
            status: 'Unsuspended automatically after suspension period expired',
          },
        }).catch(() => {});
      } catch (_err) {}
    }
  } catch (_error) {}
}

let autoUnsuspendInterval = null;
const INTERVAL_MS = 60 * 1000;

function startAutoUnsuspendJob() {
  if (autoUnsuspendInterval) return;
  setTimeout(runAutoUnsuspendSweep, 10000);
  autoUnsuspendInterval = setInterval(runAutoUnsuspendSweep, INTERVAL_MS);
  process.stdout.write('[Job] Started auto-unsuspend servers job (runs every 60 seconds)\n');
}

function stopAutoUnsuspendJob() {
  if (autoUnsuspendInterval) {
    clearInterval(autoUnsuspendInterval);
    autoUnsuspendInterval = null;
  }
}

module.exports = {
  runAutoUnsuspendSweep,
  startAutoUnsuspendJob,
  stopAutoUnsuspendJob,
};