'use strict';

const User = require('../models/User');
const Server = require('../models/Server');
const { suspendServer, unsuspendServer, updateServerDetails } = require('../services/pterodactyl');
const { calculateUserTotalResources } = require('../utils/resourceCalculator');
const { writeAudit } = require('../middleware/audit');
const { invalidateServerCaches } = require('../utils/serverCacheInvalidation');
const { invalidateUserCaches } = require('../utils/userCacheInvalidation');
const { publishEvent } = require('../lib/redis');

async function buildUserResourcePool(userId) {
  const user = await User.findOne({ publicId: userId }).lean();
  if (!user) return null;

  const { totalResources, activePlans } = await calculateUserTotalResources(user);
  return { user, pool: totalResources, activePlans };
}

async function doSuspend(server, reason, extraMeta = {}) {
  const cleanReason = (reason || '').trim();
  const description = cleanReason ? `${cleanReason}. (Lifetime)` : 'Suspended permanently (Lifetime)';

  try {
    if (server.panelServerId && server.owner?.pterodactylUserId) {
      await suspendServer(server.panelServerId);
      await updateServerDetails(server.panelServerId, {
        name: server.name,
        user: server.owner.pterodactylUserId,
        description,
      });
    }

    await Server.findByIdAndUpdate(server._id, {
      status: 'suspended',
      suspended: true,
      suspendedUntil: null,
      suspensionReason: cleanReason || null,
    });

    const publicServerId = server.publicId;
    const ownerPublicId = server.owner?.publicId;

    if (ownerPublicId) {
      await invalidateServerCaches({ userId: ownerPublicId, publicServerId });
      await invalidateUserCaches(ownerPublicId);
      await publishEvent(`user:${ownerPublicId}:servers`, { type: 'SERVER_UPDATED', serverId: publicServerId });
    }

    await writeAudit('system', 'server.compliance.suspended', 'server', server.publicId, {
      serverName: server.name,
      panelServerId: server.panelServerId,
      targetUserId: ownerPublicId,
      userId: ownerPublicId,
      reason: cleanReason,
      description,
      category: 'system_event',
      ...extraMeta,
    }).catch(() => {});
  } catch (err) {
    await writeAudit('system', 'server.compliance.suspend_failed', 'server', server.publicId, {
      serverName: server.name,
      panelServerId: server.panelServerId,
      targetUserId: server.owner?.publicId,
      userId: server.owner?.publicId,
      reason: cleanReason,
      error: err.message,
      category: 'system_event',
      ...extraMeta,
    }).catch(() => {});
  }
}

async function doUnsuspend(server) {
  try {
    if (server.panelServerId) {
      await unsuspendServer(server.panelServerId);
      if (server.owner?.pterodactylUserId) {
        await updateServerDetails(server.panelServerId, {
          name: server.name,
          user: server.owner.pterodactylUserId,
          description: '',
        });
      }
    }

    await Server.findByIdAndUpdate(server._id, {
      status: 'active',
      suspended: false,
      suspendedUntil: null,
      suspensionReason: null,
    });

    const publicServerId = server.publicId;
    const ownerPublicId = server.owner?.publicId;

    if (ownerPublicId) {
      await invalidateServerCaches({ userId: ownerPublicId, publicServerId });
      await invalidateUserCaches(ownerPublicId);
      await publishEvent(`user:${ownerPublicId}:servers`, { type: 'SERVER_ACTIVE', serverId: publicServerId });
    }

    await writeAudit('system', 'server.unsuspend', 'server', server.publicId, {
      serverName: server.name,
      panelServerId: server.panelServerId,
      targetUserId: ownerPublicId,
      userId: ownerPublicId,
      status: 'active',
      source: 'compliance_job',
      category: 'system_event',
    }).catch(() => {});
  } catch (err) {
    await writeAudit('system', 'server.unsuspend_failed', 'server', server.publicId, {
      serverName: server.name,
      panelServerId: server.panelServerId,
      targetUserId: server.owner?.publicId,
      userId: server.owner?.publicId,
      error: err.message,
      category: 'system_event',
    }).catch(() => {});
  }
}

module.exports = {
  buildUserResourcePool,
  doSuspend,
  doUnsuspend,
};
