/**
 * Admin Users Servers Sub-Service
 * Complies with ISO/IEC 25010 (Maintainability, Single Responsibility)
 */

const { Types } = require('mongoose');
const Server = require('../../../models/Server');
const User = require('../../../models/User');
const AppError = require('../../../utils/AppError');
const {
  deleteServer: deletePanelServer,
  updateServerBuild,
  getServer: getPanelServer,
  updateServerDetails,
} = require('../../../services/pterodactyl');
const { deleteCachePattern } = require('../../../lib/redis');
const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');

const deleteServer = async (req, id, serverId) => {
  if (!Types.ObjectId.isValid(String(id)) || !Types.ObjectId.isValid(String(serverId))) {
    throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
  }
  const server = await Server.findOne({ _id: String(serverId), owner: String(id) });
  if (!server) throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
  try {
    await deletePanelServer(server.panelServerId);
  } catch (e) {
    throw new AppError('Panel delete failed', 400, 'ERR_PANEL_DELETE_FAILED', { details: e?.response?.data || e.message });
  }
  await Server.deleteOne({ _id: server._id });

  const adminId = req?.user?.sub || req?.user?.userId || req?.user?._id;
  const adminUsername = req?.user?.username || 'admin';
  const adminRole = req?.user?.role || 'admin';

  await writeAudit(req, 'admin.user.server.delete', 'server', server._id.toString(), {
    owner: id,
    serverName: server.name,
    adminId,
    adminUsername,
    adminRole,
  });
  await logUserActivity(req, 'admin.user.server.delete', {
    serverId: server._id.toString(),
    serverName: server.name,
    owner: id,
    updatedByAdmin: true,
    adminId,
    adminUsername,
    adminRole,
  }, id);
  await deleteCachePattern('admin:users*');
  return { ok: true };
};

const getServer = async (id, serverId) => {
  if (!Types.ObjectId.isValid(String(id)) || !Types.ObjectId.isValid(String(serverId))) {
    throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
  }
  const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
  const server = await Server.findOne({ _id: String(serverId), owner: String(id) })
    .populate('eggId', 'name icon')
    .populate('locationId', 'name')
    .lean();
  if (!server) throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
  let clientUrl = base;
  try {
    const panel = await getPanelServer(server.panelServerId);
    const identifier = panel?.identifier || panel?.uuid || null;
    if (identifier) clientUrl = `${base}/server/${identifier}`;
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
    return { ...server, limits: updatedLimits, clientUrl };
  } catch (_) {
    return { ...server, clientUrl };
  }
};

const updateServer = async (req, id, serverId, data) => {
  if (!Types.ObjectId.isValid(String(id)) || !Types.ObjectId.isValid(String(serverId))) {
    throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
  }
  const server = await Server.findOne({ _id: String(serverId), owner: String(id) });
  if (!server) throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
  const user = await User.findById(String(id));
  if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');

  if (data.limits) {
    const userLimits = user.resources || {};
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
    } catch (e) {
      throw new AppError('Panel update failed', 400, 'ERR_PANEL_UPDATE_FAILED', { details: e?.response?.data || e.message });
    }
  }

  if (typeof data.name === 'string' && data.name.trim()) {
    try {
      await updateServerDetails(server.panelServerId, {
        name: data.name.trim(),
        user: user.pterodactylUserId,
        external_id: user._id.toString(),
      });
      server.name = data.name.trim();
    } catch (e) {
      throw new AppError('Panel rename failed', 400, 'ERR_PANEL_RENAME_FAILED', { details: e?.response?.data || e.message });
    }
  }

  await server.save();

  const adminId = req?.user?.sub || req?.user?.userId || req?.user?._id;
  const adminUsername = req?.user?.username || 'admin';
  const adminRole = req?.user?.role || 'admin';

  await writeAudit(req, 'admin.user.server.update', 'server', server._id.toString(), {
    owner: id,
    serverName: server.name,
    changed: data,
    adminId,
    adminUsername,
    adminRole,
  });
  await logUserActivity(req, 'admin.user.server.update', {
    serverId: server._id.toString(),
    serverName: server.name,
    changed: data,
    updatedByAdmin: true,
    adminId,
    adminUsername,
    adminRole,
  }, id);
  await deleteCachePattern('admin:users*');
  return { server };
};

module.exports = {
  deleteServer,
  getServer,
  updateServer,
};
