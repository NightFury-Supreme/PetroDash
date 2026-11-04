const Server = require('../../../models/Server');
const User = require('../../../models/User');
const AppError = require('../../../utils/AppError');
const {
  deleteServer: deletePanelServer,
  updateServerBuild,
  getServer: getPanelServer,
  updateServerDetails,
} = require('../../../services/pterodactyl');
const { deleteCache, acquireLock, releaseLock } = require('../../../lib/redis');
const { invalidateUserCaches } = require('../../../utils/userCacheInvalidation');
const { invalidateServerCaches } = require('../../../utils/serverCacheInvalidation');
const { calculateUserTotalResources } = require('../../../utils/resourceCalculator');
const { writeAudit } = require('../../../middleware/audit');
const { isValidEntityId, buildIdFilter, formatPublicEntity } = require('../../../utils/publicId');

const deleteServer = async (req, id, serverId) => {
  if (!isValidEntityId(String(id), 'user') || !isValidEntityId(String(serverId), 'server')) {
    throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
  }

  const lockToken = await acquireLock(`server:mutation:${serverId}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }

  try {
    const user = await User.findOne(buildIdFilter(id));
    if (!user) throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');

    const server = await Server.findOne({ ...buildIdFilter(serverId), owner: user._id });
    if (!server) throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');

    if (server.panelServerId) {
      try {
        await deletePanelServer(server.panelServerId);
      } catch (panelError) {
        const status = panelError?.response?.status;
        if (status !== 404) {
          const PendingDeletion = require('../../../models/PendingDeletion');
          await PendingDeletion.create({ resourceType: 'server', panelId: server.panelServerId }).catch(() => {});
        }
      }
    }
    const eggId = server.eggId ? String(server.eggId) : null;
    const locationId = server.locationId ? String(server.locationId) : null;
    const publicServerId = server.publicId;
    const publicUserId = user.publicId;

    await Server.deleteOne({ _id: server._id });

    const adminId = req?.user?.sub;
    const adminUsername = req?.user?.username || 'admin';
    const adminRole = req?.user?.role || 'admin';

    await writeAudit(req, 'admin.user.server.delete', 'server', publicServerId, {
      targetUserId: publicUserId,
      owner: publicUserId,
      serverName: server.name,
      adminId,
      adminUsername,
      adminRole,
    });

    await invalidateUserCaches(publicUserId);
    await invalidateServerCaches({
      userId: publicUserId,
      publicServerId,
      eggId,
      locationId,
    });
    return { ok: true };
  } finally {
    await releaseLock(`server:mutation:${serverId}`, lockToken);
  }
};

const getServer = async (id, serverId) => {
  if (!isValidEntityId(String(id), 'user') || !isValidEntityId(String(serverId), 'server')) {
    throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
  }
  const user = await User.findOne(buildIdFilter(id));
  if (!user) throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');

  const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
  const server = await Server.findOne({ ...buildIdFilter(serverId), owner: user._id })
    .populate('eggId', 'name icon publicId')
    .populate('locationId', 'name flag publicId')
    .lean();
  if (!server) throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');

  let clientUrl = base;
  const isSuspended = server.status === 'suspended' || Boolean(server.suspended);
  try {
    const panelResponse = await getPanelServer(server.panelServerId);
    const panel = panelResponse?.attributes || panelResponse;
    const identifier = panel?.identifier || panel?.uuid || null;
    if (identifier) clientUrl = `${base}/server/${identifier}`;
    const suspended = isSuspended || panel?.suspended === true || panel?.suspended === 1;
    const panelBuild = panel?.limits || panel?.build || {};
    const panelFeatures = panel?.feature_limits || {};
    const updatedLimits = {
      diskMb: Number(panelBuild.disk) ?? server.limits?.diskMb,
      memoryMb: Number(panelBuild.memory) ?? server.limits?.memoryMb,
      cpuPercent: Number(panelBuild.cpu) ?? server.limits?.cpuPercent,
      backups: Number(panelFeatures.backups) ?? server.limits?.backups,
      databases: Number(panelFeatures.databases) ?? server.limits?.allocations,
      allocations: Number(panelFeatures.allocations) ?? server.limits?.allocations,
    };
    const hasChange = ['diskMb', 'memoryMb', 'cpuPercent', 'backups', 'databases', 'allocations'].some(
      (k) => Number(server.limits?.[k] || 0) !== Number(updatedLimits[k] || 0)
    );
    if (hasChange) await Server.updateOne({ _id: server._id }, { $set: { limits: updatedLimits } });
    return formatPublicEntity({ ...server, limits: updatedLimits, clientUrl, suspended, unreachable: false }, 'server');
  } catch (_panelErr) {
    return formatPublicEntity({ ...server, clientUrl, suspended: isSuspended, unreachable: true }, 'server');
  }
};

const updateServer = async (req, id, serverId, data) => {
  if (!isValidEntityId(String(id), 'user') || !isValidEntityId(String(serverId), 'server')) {
    throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
  }

  const lockToken = await acquireLock(`server:mutation:${serverId}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }

  try {
    const user = await User.findOne(buildIdFilter(id));
    if (!user) throw new AppError('User not found', 404, 'ERR_SERVER_NOT_FOUND');

    const server = await Server.findOne({ ...buildIdFilter(serverId), owner: user._id });
    if (!server) throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');

    if (data.limits) {
      const { totalResources: userLimits } = await calculateUserTotalResources(user);
      const others = await Server.find({ owner: user._id, _id: { $ne: server._id } }).lean();
      const used = others.reduce(
        (acc, s) => {
          const l = s.limits || {};
          acc.diskMb += Number(l.diskMb) || 0;
          acc.memoryMb += Number(l.memoryMb) || 0;
          acc.cpuPercent += Number(l.cpuPercent) || 0;
          acc.backups += Number(l.backups) || 0;
          acc.databases += Number(l.databases) || 0;
          acc.allocations += Number(l.allocations) || 0;
          return acc;
        },
        { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 }
      );

      const remaining = {
        diskMb: Math.max(0, Number(userLimits.diskMb || 0) - used.diskMb),
        memoryMb: Math.max(0, Number(userLimits.memoryMb || 0) - used.memoryMb),
        cpuPercent: Math.max(0, Number(userLimits.cpuPercent || 0) - used.cpuPercent),
        backups: Math.max(0, Number(userLimits.backups || 0) - used.backups),
        databases: Math.max(0, Number(userLimits.databases || 0) - used.databases),
        allocations: Math.max(0, Number(userLimits.allocations || 0) - used.allocations),
      };

      const newLimits = { ...server.limits, ...data.limits };
      const violations = {};
      if (newLimits.diskMb > remaining.diskMb) violations.diskMb = `Exceeds remaining disk (${remaining.diskMb} MB)`;
      if (newLimits.memoryMb > remaining.memoryMb) violations.memoryMb = `Exceeds remaining memory (${remaining.memoryMb} MB)`;
      if (newLimits.cpuPercent > remaining.cpuPercent) violations.cpuPercent = `Exceeds remaining CPU (${remaining.cpuPercent}%)`;
      if (newLimits.backups > remaining.backups) violations.backups = `Exceeds remaining backups (${remaining.backups})`;
      if (newLimits.databases > remaining.databases) violations.databases = `Exceeds remaining databases (${remaining.databases})`;
      if (newLimits.allocations > remaining.allocations) violations.allocations = `Exceeds remaining allocations (${remaining.allocations})`;

      if (Object.keys(violations).length > 0) {
        throw new AppError('Requested resources exceed limits', 400, 'ERR_RESOURCES_EXCEEDED', {
          violations,
          remaining,
          limits: userLimits,
        });
      }

      try {
        const panel = await getPanelServer(server.panelServerId);
        const currentAllocationId = panel?.allocation || panel?.relationships?.allocation?.attributes?.id || 0;
        await updateServerBuild(server.panelServerId, {
          allocation: currentAllocationId,
          memory: newLimits.memoryMb,
          swap: 0,
          disk: newLimits.diskMb,
          io: 500,
          cpu: newLimits.cpuPercent,
          databases: newLimits.databases,
          allocations: newLimits.allocations,
          backups: newLimits.backups,
        });
        server.limits = newLimits;
      } catch (_panelError) {
        throw AppError.badRequest('Panel update failed', 'ERR_PANEL_UPDATE_FAILED');
      }
    }

    if (typeof data.name === 'string' && data.name.trim()) {
      try {
        await updateServerDetails(server.panelServerId, {
          name: data.name.trim(),
          user: user.pterodactylUserId,
        });
        server.name = data.name.trim();
      } catch (_panelError) {
        throw AppError.badRequest('Panel rename failed', 'ERR_PANEL_RENAME_FAILED');
      }
    }

    await server.save();

    const adminId = req?.user?.sub;
    const adminUsername = req?.user?.username || 'admin';
    const adminRole = req?.user?.role || 'admin';

    const publicServerId = server.publicId;
    const publicUserId = user.publicId;

    await writeAudit(req, 'admin.user.server.update', 'server', publicServerId, {
      targetUserId: publicUserId,
      owner: publicUserId,
      serverName: server.name,
      changed: data,
      adminId,
      adminUsername,
      adminRole,
    });

    await invalidateUserCaches(publicUserId);
    await invalidateServerCaches({
      userId: publicUserId,
      publicServerId,
      eggId: server.eggId ? String(server.eggId) : null,
      locationId: server.locationId ? String(server.locationId) : null,
    });

    const updatedServer = await Server.findById(server._id).lean();
    return { server: formatPublicEntity(updatedServer, 'server') };
  } finally {
    await releaseLock(`server:mutation:${serverId}`, lockToken);
  }
};

module.exports = {
  deleteServer,
  getServer,
  updateServer,
};
