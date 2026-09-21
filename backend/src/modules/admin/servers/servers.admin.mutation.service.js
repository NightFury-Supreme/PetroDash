/* ==========================================================================
   Admin Servers Mutation Service Layer
   Compliance: ISO/IEC 25010, Single Responsibility Principle, Audit Logging
========================================================================== */

const Server = require('../../../models/Server');
const User = require('../../../models/User');
const { deleteCache, deleteCachePattern } = require('../../../lib/redis');
const { updateServerBuild, getServer, updateServerDetails, forceDeleteServer } = require('../../../services/pterodactyl');
const { logUserActivity } = require('../../../middleware/userActivity');
const AppError = require('../../../utils/AppError');

const clearQueue = async (query = {}) => {
  const { locationId, eggId } = query;
  const q = { status: { $in: ['queued', 'error'] } };

  if (locationId && locationId !== 'all') {
    q.locationId = locationId;
  }
  if (eggId && eggId !== 'all') {
    q.eggId = eggId;
  }

  const serversToDelete = await Server.find(q).lean();

  if (serversToDelete.length === 0) {
    return { success: true, count: 0, deletedCount: 0, message: 'Queue cleared successfully (0 servers found).' };
  }

  const result = await Server.deleteMany(q);

  const uniqueOwners = [...new Set(serversToDelete.map((s) => s.owner.toString()))];
  for (const ownerId of uniqueOwners) {
    await deleteCache(`user:${ownerId}:profile`);
    await deleteCachePattern(`api:servers:${ownerId}:*`);
    await deleteCachePattern(`server:usage:${ownerId}`);
    await logUserActivity(null, 'admin.server.queue.clear', {
      clearedByAdmin: true,
    }, ownerId);
  }
  await deleteCachePattern('api:admin:servers:*');
  await deleteCache('eggs:counts');

  return {
    deletedCount: result.deletedCount,
    success: true,
    count: result.deletedCount,
    message: `Successfully cleared ${result.deletedCount} servers from the queue.`,
  };
};

const updateServer = async (id, data) => {
  const { limits, name } = data;

  const server = await Server.findById(String(id));
  if (!server) {
    throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
  }

  if (server.status && server.status.toLowerCase() === 'creating') {
    throw new AppError('Cannot edit creating server.', 403, 'ERR_SERVER_CREATING');
  }

  let unreachable = false;
  let suspended = false;
  let currentAllocationId = 0;
  try {
    if (server.panelServerId) {
      const panelResponse = await getServer(server.panelServerId);
      const panel = panelResponse?.attributes;
      suspended = panel?.suspended === true || panel?.suspended === 1;
      currentAllocationId = panel?.allocation || panel?.relationships?.allocation?.attributes?.id || 0;
    }
  } catch (_panelError) {
    unreachable = true;
  }

  if (unreachable) {
    throw new AppError('Cannot edit unreachable server.', 400, 'ERR_SERVER_UNREACHABLE');
  }

  if (suspended || (server.status && server.status.toLowerCase() === 'suspended')) {
    throw new AppError('Cannot edit suspended server.', 400, 'ERR_SERVER_SUSPENDED');
  }

  const oldName = server.name;
  const oldLimits = { ...server.limits };

  try {
    if (name && name !== server.name) {
      const user = await User.findById(server.owner);
      if (user && user.pterodactylUserId) {
        await updateServerDetails(server.panelServerId, {
          name,
          user: user.pterodactylUserId,
          external_id: user._id.toString(),
        });
        server.name = name;
      }
    }

    await updateServerBuild(server.panelServerId, {
      allocation: currentAllocationId,
      memory: limits.memoryMb,
      swap: 0,
      disk: limits.diskMb,
      io: 500,
      cpu: limits.cpuPercent,
      databases: limits.databases,
      allocations: limits.allocations,
      backups: limits.backups,
      threads: null,
      oom_disabled: false,
    });
  } catch (panelError) {
    throw new AppError(`Panel update failed: ${panelError.message}`, 400, 'ERR_PANEL_UPDATE_FAILED');
  }

  const changes = {};
  if (server.name !== oldName) {
    changes.name = { old: oldName, new: server.name };
  }
  for (const [key, value] of Object.entries(limits)) {
    if (oldLimits[key] !== value) {
      changes[key] = { old: oldLimits[key] || 0, new: value };
    }
  }

  server.limits = limits;
  await server.save();

  await logUserActivity(null, 'admin.server.update', {
    serverId: server._id.toString(),
    serverName: server.name,
    updatedByAdmin: true,
    changes: Object.keys(changes).length > 0 ? changes : undefined,
  }, server.owner.toString());

  await deleteCachePattern('api:admin:servers:*');
  await deleteCachePattern(`api:servers:${server.owner}:*`);
  await deleteCachePattern(`server:usage:${server.owner}`);
  await deleteCachePattern(`api:admin:server:${id}`);

  return { server, changes };
};

const deleteServer = async (id, isForce = true) => {
  const server = await Server.findById(String(id));
  if (!server) {
    throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
  }

  if (server.status && server.status.toLowerCase() === 'creating') {
    throw new AppError('Cannot delete creating server.', 403, 'ERR_SERVER_CREATING');
  }

  if (server.panelServerId) {
    try {
      await forceDeleteServer(server.panelServerId);
    } catch (panelError) {
      const status = panelError?.response?.status;
      const detail = panelError?.response?.data || panelError.message;

      if (status === 404) {
        console.warn(`[Admin] Panel server ${server.panelServerId} already absent — removing from DB.`);
      } else if (!isForce) {
        throw new AppError(`Panel deletion failed: ${detail}`, 400, 'ERR_PANEL_DELETION_FAILED');
      } else {
        console.error(`[Admin] Force-delete panel error for ${server.panelServerId}:`, detail);
      }
    }
  }

  await Server.findByIdAndDelete(String(id));

  if (server.owner) {
    await logUserActivity(null, 'admin.server.delete', {
      serverId: server._id.toString(),
      serverName: server.name,
      panelServerId: server.panelServerId,
      deletedByAdmin: true,
    }, server.owner.toString());
  }

  await deleteCachePattern('api:admin:servers:*');
  await deleteCachePattern(`api:servers:${server.owner}:*`);
  await deleteCachePattern(`server:usage:${server.owner}`);
  await deleteCache(`user:${server.owner}:profile`);
  await deleteCache('eggs:counts');
  await deleteCachePattern(`api:admin:server:${id}`);

  return server;
};

module.exports = {
  clearQueue,
  updateServer,
  deleteServer,
};
