const Server = require('../../../models/Server');
const User = require('../../../models/User');
const { acquireLock, releaseLock } = require('../../../lib/redis');
const { invalidateServerCaches } = require('../../../utils/serverCacheInvalidation');
const { updateServerBuild, getServer, updateServerDetails, forceDeleteServer } = require('../../../services/pterodactyl');
const { writeAudit } = require('../../../middleware/audit');
const AppError = require('../../../utils/AppError');
const { buildIdFilter, formatPublicEntity } = require('../../../utils/publicId');

const clearQueue = async (query = {}, req = null) => {
  const lockToken = await acquireLock('servers:queue:clear', 10000);
  if (!lockToken) {
    throw AppError.conflict('Queue clear operation in progress', 'ERR_QUEUE_LOCKED');
  }

  try {
    const { locationId, eggId } = query;
    const q = { status: { $in: ['queued', 'error'] } };

    if (locationId && locationId !== 'all') {
      q.locationId = locationId;
    }
    if (eggId && eggId !== 'all') {
      q.eggId = eggId;
    }

    const serversToDelete = await Server.find(q).populate('owner', 'publicId').lean();

    if (serversToDelete.length === 0) {
      return { success: true, count: 0, deletedCount: 0, message: 'Queue cleared successfully (0 servers found).' };
    }

    const result = await Server.deleteMany(q);

    const uniqueOwners = [...new Set(serversToDelete.map((s) => s.owner?.publicId).filter(Boolean))];
    for (const ownerId of uniqueOwners) {
      await invalidateServerCaches({ userId: ownerId });
      await writeAudit('system', 'server.delete', 'server', 'queue', {
        targetUserId: ownerId,
        clearedFromQueue: true,
        category: 'user_activity',
      });
    }
    if (uniqueOwners.length === 0) {
      await invalidateServerCaches({ eggId, locationId });
    }

    await writeAudit(req, 'admin.server.queue.clear', 'server', 'queue', {
      deletedCount: result.deletedCount,
      locationId: locationId || 'all',
      eggId: eggId || 'all',
    });

    return {
      deletedCount: result.deletedCount,
      success: true,
      count: result.deletedCount,
      message: `Successfully cleared ${result.deletedCount} servers from the queue.`,
    };
  } finally {
    await releaseLock('servers:queue:clear', lockToken);
  }
};

const updateServer = async (id, data, req = null) => {
  const lockToken = await acquireLock(`server:${id}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Server operation already in progress', 'ERR_SERVER_LOCKED');
  }

  try {
    const { limits, name } = data;

    const server = await Server.findOne(buildIdFilter(id)).populate('owner', 'publicId');
    if (!server) {
      throw AppError.notFound('Server not found', 'ERR_SERVER_NOT_FOUND');
    }

    if (server.status && server.status.toLowerCase() === 'creating') {
      throw AppError.forbidden('Cannot edit creating server', 'ERR_SERVER_CREATING');
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
      throw AppError.badRequest('Cannot edit unreachable server', 'ERR_SERVER_UNREACHABLE');
    }

    if (suspended || (server.status && server.status.toLowerCase() === 'suspended')) {
      throw AppError.badRequest('Cannot edit suspended server', 'ERR_SERVER_SUSPENDED');
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
    } catch (_panelError) {
      throw AppError.badRequest('Panel update failed', 'ERR_PANEL_UPDATE_FAILED');
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

    const publicServerId = server.publicId;
    const eggId = server.eggId ? String(server.eggId) : null;
    const locationId = server.locationId ? String(server.locationId) : null;

    const ownerId = server.owner?.publicId || (typeof server.owner === 'string' ? server.owner : null);
    if (ownerId) {
      await writeAudit(
        req?.user?.publicId || 'system',
        'server.update',
        'server',
        publicServerId,
        {
          serverId: publicServerId,
          serverName: server.name,
          targetUserId: ownerId,
          changes: Object.keys(changes).length > 0 ? changes : undefined,
          category: 'user_activity',
          actorRole: req?.user?.role || 'admin',
          actorUsername: req?.user?.username || 'Staff Operator',
          performedByStaff: Boolean(req?.user),
        }
      );
    }

    await writeAudit(req, 'admin.server.update', 'server', publicServerId, {
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    });

    await invalidateServerCaches({
      userId: server.owner?.publicId,
      publicServerId,
      eggId,
      locationId,
    });

    return { server: formatPublicEntity(server, 'server'), changes };
  } finally {
    await releaseLock(`server:${id}`, lockToken);
  }
};

const deleteServer = async (id, isForce = true, req = null) => {
  const lockToken = await acquireLock(`server:${id}`, 10000);
  if (!lockToken) {
    throw AppError.conflict('Server operation already in progress', 'ERR_SERVER_LOCKED');
  }

  try {
    const server = await Server.findOne(buildIdFilter(id)).populate('owner', 'publicId');
    if (!server) {
      throw AppError.notFound('Server not found', 'ERR_SERVER_NOT_FOUND');
    }

    if (server.status && server.status.toLowerCase() === 'creating') {
      throw AppError.forbidden('Cannot delete creating server', 'ERR_SERVER_CREATING');
    }

    if (server.panelServerId) {
      try {
        await forceDeleteServer(server.panelServerId);
      } catch (panelError) {
        const status = panelError?.response?.status;

        if (status !== 404) {
          const PendingDeletion = require('../../../models/PendingDeletion');
          await PendingDeletion.create({ resourceType: 'server', panelId: server.panelServerId }).catch(() => {});
          if (!isForce) {
            throw AppError.badRequest('Panel deletion failed', 'ERR_PANEL_DELETION_FAILED');
          }
          await writeAudit(req, 'admin.server.force_delete_panel_error', 'server', server.publicId, {
            panelServerId: server.panelServerId,
            error: 'ERR_PANEL_DELETION_FAILED',
          }).catch(() => {});
        }
      }
    }

    const eggId = server.eggId ? String(server.eggId) : null;
    const locationId = server.locationId ? String(server.locationId) : null;
    const publicServerId = server.publicId;

    await Server.deleteOne({ _id: server._id });

    const ownerId = server.owner?.publicId || (typeof server.owner === 'string' ? server.owner : null);
    if (ownerId) {
      await writeAudit(
        req?.user?.publicId || 'system',
        'server.delete',
        'server',
        publicServerId,
        {
          serverId: publicServerId,
          serverName: server.name,
          panelServerId: server.panelServerId,
          targetUserId: ownerId,
          category: 'user_activity',
          actorRole: req?.user?.role || 'admin',
          actorUsername: req?.user?.username || 'Staff Operator',
          performedByStaff: Boolean(req?.user),
        }
      );
    }

    await writeAudit(req, 'admin.server.delete', 'server', publicServerId, {
      panelServerId: server.panelServerId,
    });

    await invalidateServerCaches({
      userId: server.owner?.publicId,
      publicServerId,
      eggId,
      locationId,
    });

    return formatPublicEntity(server, 'server');
  } finally {
    await releaseLock(`server:${id}`, lockToken);
  }
};

module.exports = {
  clearQueue,
  updateServer,
  deleteServer,
};
