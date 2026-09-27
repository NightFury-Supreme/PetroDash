/**
 * Server Mutation Service
 * Handles server modifications (limits, renaming) and deletions
 * with atomic locking, panel synchronization, and cache management.
 */

const User = require('../../models/User');
const Server = require('../../models/Server');
const { 
  getServer: getPanelServer, 
  updateServerDetails, 
  updateServerBuild, 
  forceDeleteServer 
} = require('../../services/pterodactyl');
const { deleteCache, deleteCachePattern } = require('../../lib/redis');
const { sendServerDeletedEmail } = require('./server.mail');
const AppError = require('../../utils/AppError');

class ServerMutationService {
  async updateServer(userId, serverId, { name, limits }) {
    const lockTimeout = new Date(Date.now() - 30000);
    const user = await User.findOneAndUpdate(
      { 
        _id: userId, 
        $or: [
          { serverLock: { $exists: false } },
          { serverLock: null },
          { serverLock: { $lt: lockTimeout } }
        ]
      },
      { $set: { serverLock: new Date() } },
      { new: true }
    );

    if (!user) {
      throw new AppError('Another server operation is currently in progress. Please wait a moment.', 429, 'ERR_SERVER_LOCKED');
    }

    try {
      const server = await Server.findOne({ _id: String(serverId), owner: userId });
      if (!server) {
        throw AppError.notFound('Server not found or access denied', 'ERR_SERVER_NOT_FOUND');
      }

      if (server.status && server.status.toLowerCase() === 'creating') {
        throw AppError.forbidden('Cannot edit server while it is being created', 'ERR_SERVER_CREATING');
      }

      let panelServerResponse = null;
      let panelSuspended = false;

      if (server.panelServerId) {
        try {
          panelServerResponse = await getPanelServer(server.panelServerId);
          const panelAttributes = panelServerResponse?.attributes;
          panelSuspended = Boolean(
            panelAttributes?.suspended === true ||
            panelAttributes?.suspended === 1 ||
            panelAttributes?.status === 'suspended'
          );
        } catch (_) {}
      }

      const serverStatus = server.status?.toLowerCase();
      const locallySuspended = serverStatus === 'suspended' || server.suspended === true;
      if (locallySuspended || panelSuspended) {
        throw AppError.forbidden('Cannot update suspended server. Contact staff for assistance.', 'ERR_SERVER_SUSPENDED');
      }

      if (serverStatus === 'installing' || serverStatus === 'transferring') {
        throw AppError.conflict(`Cannot update server while it is ${serverStatus}`, 'ERR_SERVER_BUSY');
      }

      const changes = {};

      if (name && typeof name === 'string' && name.trim()) {
        const newName = name.trim();
        if (newName !== server.name) {
          if (server.panelServerId) {
            try {
              await updateServerDetails(server.panelServerId, { 
                name: newName, 
                user: user.pterodactylUserId, 
                external_id: user._id.toString() 
              });
            } catch (panelError) {
              throw AppError.badRequest('Panel rename failed', 'ERR_PANEL_RENAME_FAILED', panelError?.response?.data?.errors?.[0]?.detail || panelError.message);
            }
          }
          changes.name = { old: server.name, new: newName };
          server.name = newName;
        }
      }

      if (limits && typeof limits === 'object') {
        const userLimits = user.resources || {};
        const otherServers = await Server.find({ owner: user._id, _id: { $ne: server._id } }).lean();

        const used = otherServers.reduce((acc, s) => {
          const l = s.limits || {};
          acc.diskMb += Number(l.diskMb) || 0;
          acc.memoryMb += Number(l.memoryMb) || 0;
          acc.cpuPercent += Number(l.cpuPercent) || 0;
          acc.backups += Number(l.backups) || 0;
          acc.databases += Number(l.databases) || 0;
          acc.allocations += Number(l.allocations) || 0;
          return acc;
        }, { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 });

        const remaining = {
          diskMb: Math.max(0, Number(userLimits.diskMb || 0) - used.diskMb),
          memoryMb: Math.max(0, Number(userLimits.memoryMb || 0) - used.memoryMb),
          cpuPercent: Math.max(0, Number(userLimits.cpuPercent || 0) - used.cpuPercent),
          backups: Math.max(0, Number(userLimits.backups || 0) - used.backups),
          databases: Math.max(0, Number(userLimits.databases || 0) - used.databases),
          allocations: Math.max(0, Number(userLimits.allocations || 0) - used.allocations),
        };

        const newLimits = { ...server.limits, ...limits };
        const violations = {};

        const min = { diskMb: 100, memoryMb: 128, cpuPercent: 10, backups: 0, databases: 0, allocations: 1 };
        if (newLimits.diskMb < min.diskMb) violations.diskMb = `Minimum disk is ${min.diskMb} MB`;
        if (newLimits.memoryMb < min.memoryMb) violations.memoryMb = `Minimum memory is ${min.memoryMb} MB`;
        if (newLimits.cpuPercent < min.cpuPercent) violations.cpuPercent = `Minimum CPU is ${min.cpuPercent}%`;
        if (newLimits.backups < min.backups) violations.backups = `Minimum backups is ${min.backups}`;
        if (newLimits.databases < min.databases) violations.databases = `Minimum databases is ${min.databases}`;
        if (newLimits.allocations < min.allocations) violations.allocations = `Minimum allocations is ${min.allocations}`;

        if (newLimits.diskMb > remaining.diskMb) violations.diskMb = `Exceeds remaining disk (${remaining.diskMb.toLocaleString()} MB available)`;
        if (newLimits.memoryMb > remaining.memoryMb) violations.memoryMb = `Exceeds remaining memory (${remaining.memoryMb.toLocaleString()} MB available)`;
        if (newLimits.cpuPercent > remaining.cpuPercent) violations.cpuPercent = `Exceeds remaining CPU (${remaining.cpuPercent}% available)`;
        if (newLimits.backups > remaining.backups) violations.backups = `Exceeds remaining backups (${remaining.backups} available)`;
        if (newLimits.databases > remaining.databases) violations.databases = `Exceeds remaining databases (${remaining.databases} available)`;
        if (newLimits.allocations > remaining.allocations) violations.allocations = `Exceeds remaining allocations (${remaining.allocations} available)`;

        if (Object.keys(violations).length > 0) {
          throw AppError.badRequest('Requested resources exceed your limits', 'ERR_SERVER_LIMIT_EXCEEDED', { violations, remaining, limits: userLimits });
        }

        const diffs = {};
        for (const [key, value] of Object.entries(newLimits)) {
          if (server.limits[key] !== value) {
            diffs[key] = { old: server.limits[key] || 0, new: value };
          }
        }

        server.limits = newLimits;
        if (Object.keys(diffs).length > 0) {
          changes.limits = diffs;
        }

        if (server.panelServerId) {
          try {
            if (!panelServerResponse) {
              panelServerResponse = await getPanelServer(server.panelServerId);
            }
            const panelServer = panelServerResponse?.attributes;
            const allocations = panelServerResponse?.relationships?.allocations?.data;
            let allocationId = null;
            if (allocations && allocations.length > 0) {
              allocationId = allocations[0]?.attributes?.id || allocations[0]?.id;
            } else if (panelServer?.allocation) {
              allocationId = panelServer.allocation;
            }

            if (!allocationId) {
              throw AppError.badRequest('Could not find allocation ID for server', 'ERR_SERVER_ALLOCATION_NOT_FOUND');
            }

            await updateServerBuild(server.panelServerId, {
              allocation: allocationId,
              memory: newLimits.memoryMb,
              swap: 0,
              disk: newLimits.diskMb,
              io: 500,
              cpu: newLimits.cpuPercent,
              databases: newLimits.databases,
              allocations: newLimits.allocations,
              backups: newLimits.backups,
            });
          } catch (panelError) {
            throw AppError.badRequest('Panel update failed', 'ERR_PANEL_UPDATE_FAILED', panelError?.response?.data?.errors?.[0]?.detail || panelError.message);
          }
        }
      }

      server.updatedAt = new Date();
      await server.save();

      await deleteCache(`user:${userId}:profile`);
      await deleteCachePattern(`api:servers:${userId}:*`);
      await deleteCachePattern(`server:usage:${userId}`);
      await deleteCachePattern('api:admin:servers:*');

      return { server, changes, user };
    } finally {
      await User.updateOne({ _id: userId }, { $set: { serverLock: null } });
    }
  }

  async deleteServer(userId, serverId, reqHost = '') {
    const lockTimeout = new Date(Date.now() - 30000);
    const user = await User.findOneAndUpdate(
      { 
        _id: userId, 
        $or: [
          { serverLock: { $exists: false } },
          { serverLock: null },
          { serverLock: { $lt: lockTimeout } }
        ]
      },
      { $set: { serverLock: new Date() } },
      { new: true }
    );

    if (!user) {
      throw new AppError('Another server operation is in progress. Please wait a moment.', 429, 'ERR_SERVER_LOCKED');
    }

    try {
      const server = await Server.findOne({ _id: String(serverId), owner: userId });
      if (!server) throw AppError.notFound('Server not found', 'ERR_SERVER_NOT_FOUND');

      if (server.status && server.status.toLowerCase() === 'creating') {
        throw AppError.forbidden('Cannot delete creating server', 'ERR_SERVER_CREATING');
      }

      let serverIdentifier = null;

      if (server.panelServerId) {
        try {
          try {
            const panelServerData = await getPanelServer(server.panelServerId);
            serverIdentifier = panelServerData?.attributes?.identifier;
          } catch (_) {}
          await forceDeleteServer(server.panelServerId);
        } catch (panelError) {
          const status = panelError?.response?.status;
          if (status !== 404) {
            const { PendingDeletion } = require('../../models/PendingDeletion');
            await PendingDeletion.create({ resourceType: 'server', panelId: server.panelServerId });
          }
        }
      }

      await Server.deleteOne({ _id: server._id });

      // Send confirmation email asynchronously
      sendServerDeletedEmail(user, server, serverIdentifier, reqHost).catch(() => {});

      await deleteCache(`user:${userId}:profile`);
      await deleteCachePattern(`api:servers:${userId}:*`);
      await deleteCachePattern(`server:usage:${userId}`);
      await deleteCachePattern('api:admin:servers:*');
      await deleteCache('eggs:counts');

      return { server, user };
    } finally {
      await User.updateOne({ _id: userId }, { $set: { serverLock: null } });
    }
  }
}

module.exports = new ServerMutationService();
