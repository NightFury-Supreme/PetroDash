/**
 * Server Service Layer (Dashboard & Query Focus)
 * DB-Optimized queries, aggregation, and live status enrichment.
 */

const Server = require('../../models/Server');
const { getCache, setCache } = require('../../lib/redis');
const { getServer: getPanelServer } = require('../../services/pterodactyl');
const { hasServerLimitsChanged } = require('../../utils/security');
const AppError = require('../../utils/AppError');
const mongoose = require('mongoose');

class ServerService {
  /**
   * DB-Optimized Aggregation for Server Resource Usage
   */
  async getUsage(userId) {
    const cacheKey = `server:usage:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const result = await Server.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      { $group: {
          _id: null,
          diskMb: { $sum: "$limits.diskMb" },
          memoryMb: { $sum: "$limits.memoryMb" },
          cpuPercent: { $sum: "$limits.cpuPercent" },
          backups: { $sum: "$limits.backups" },
          databases: { $sum: "$limits.databases" },
          allocations: { $sum: "$limits.allocations" },
          servers: { $sum: 1 }
      }}
    ]);

    const usage = result[0] || {
      diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0, servers: 0
    };

    delete usage._id;

    await setCache(cacheKey, usage, 60);
    return usage;
  }

  /**
   * DB-Optimized Server Listing
   */
  async listServers(userId, paginate, page, pageSize) {
    const cacheKey = `api:servers:${userId}:${paginate}:${page}:${pageSize}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const baseQuery = { owner: userId };
    
    let listQuery = Server.find(baseQuery)
      .sort({ createdAt: -1 })
      .populate('eggId', 'name icon')
      .populate('locationId', 'name flag')
      .lean();

    if (paginate) {
      listQuery = listQuery.skip((page - 1) * pageSize).limit(pageSize);
    }

    const [list, total] = await Promise.all([
      listQuery,
      paginate ? Server.countDocuments(baseQuery) : Promise.resolve(0)
    ]);

    if (!list || list.length === 0) {
      const emptyRes = paginate ? { data: [], meta: { total: 0, page, pageSize } } : [];
      return emptyRes;
    }

    const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
    const panelPingData = await getCache('ping:panel');
    const isPanelDown = !panelPingData || panelPingData.ping === -1 || panelPingData.ping === null;
    const locationPingCache = {};

    const enriched = await Promise.all(list.map(async (s) => {
        const status = s.status || 'unknown';
        const suspended = status === 'suspended';
        
        let isNodeDown = false;
        if (s.locationId && s.locationId._id) {
          const locId = s.locationId._id.toString();
          if (locationPingCache[locId] === undefined) {
             const nodePing = await getCache(`ping:${locId}`);
             locationPingCache[locId] = !nodePing || nodePing.ping === -1 || nodePing.ping === null;
          }
          isNodeDown = locationPingCache[locId];
        }

        const isUnreachable = isPanelDown || isNodeDown;
        
        let queuePosition = null;
        if (status === 'queued') {
          const aheadCount = await Server.countDocuments({
            status: 'queued',
            $or: [
              { priority: { $gt: s.priority || 0 } },
              { priority: s.priority || 0, createdAt: { $lt: s.createdAt } }
            ]
          });
          queuePosition = aheadCount + 1;
        }
        
        return {
          _id: s._id,
          name: s.name || 'Unnamed Server',
          status: status,
          queuePosition: queuePosition,
          limits: {
            diskMb: Number(s.limits?.diskMb || 0),
            memoryMb: Number(s.limits?.memoryMb || 0),
            cpuPercent: Number(s.limits?.cpuPercent || 0),
            backups: Number(s.limits?.backups || 0),
            databases: Number(s.limits?.databases || 0),
            allocations: Number(s.limits?.allocations || 0)
          },
          eggName: s.eggId?.name || 'Unknown',
          eggIcon: s.eggId?.icon || undefined,
          location: s.locationId?.name || 'Unknown',
          locationFlag: s.locationId?.flag || undefined,
          clientUrl: `${base}`,
          createdAt: s.createdAt || new Date(),
          suspended: suspended,
          unreachable: isUnreachable
        };
    }));

    if (paginate) {
      const responseData = { data: enriched, meta: { total, page, pageSize } };
      await setCache(cacheKey, responseData, 30);
      return responseData;
    }

    await setCache(cacheKey, enriched, 30);
    return enriched;
  }

  /**
   * Fetch Single Server with Live Panel Status Sync
   */
  async getServer(userId, serverId) {
    const server = await Server.findOne({ _id: String(serverId), owner: userId })
      .populate('eggId', 'name icon')
      .populate('locationId', 'name flag')
      .lean();
    if (!server) throw AppError.notFound('Server not found', 'ERR_SERVER_NOT_FOUND');

    let unreachable = false;
    let suspended = Boolean(server.status && server.status.toLowerCase() === 'suspended');
    let errorMessage = null;

    if (server.panelServerId) {
      try {
        const panelResponse = await getPanelServer(server.panelServerId);
        const panel = panelResponse?.attributes;
        const panelBuild = panel?.limits || panel?.build || {};
        const panelFeatures = panel?.feature_limits || {};

        suspended = suspended || panel?.suspended === true || panel?.suspended === 1;
        if (panel?.status && !suspended) {
          const isInstalling = panel.status === 'installing' || (panel.container && panel.container.installed === false);
          if (isInstalling) {
            server.status = 'creating';
          } else {
            server.status = panel.status;
          }
        } else if (panel && !suspended) {
          const isInstalling = panel.container && panel.container.installed === false;
          if (isInstalling) {
            server.status = 'creating';
          }
        }

        const updatedLimits = {
          diskMb: Number(panelBuild.disk ?? panelBuild?.diskMb) ?? server.limits.diskMb,
          memoryMb: Number(panelBuild.memory ?? panelBuild?.memoryMb) ?? server.limits.memoryMb,
          cpuPercent: Number(panelBuild.cpu ?? panelBuild?.cpuPercent) ?? server.limits.cpuPercent,
          backups: Number(panelFeatures.backups) ?? server.limits.backups,
          databases: Number(panelFeatures.databases) ?? server.limits.databases,
          allocations: Number(panelFeatures.allocations) ?? server.limits.allocations,
        };

        const hasChange = hasServerLimitsChanged(server.limits, updatedLimits);
        if (hasChange) {
          await Server.updateOne({ _id: server._id }, { $set: { limits: updatedLimits } });
          Object.assign(server.limits, updatedLimits);
        }
      } catch (panelError) {
        unreachable = true;
        const detail = panelError?.response?.data?.errors?.[0]?.detail;
        errorMessage = detail || panelError?.message || 'Pterodactyl request failed';
        if (!suspended) {
          server.status = 'unreachable';
        }
      }
    }

    const responsePayload = {
      ...server,
      unreachable,
      suspended,
      error: errorMessage,
      eggName: server.eggId?.name,
      eggIcon: server.eggId?.icon,
      location: server.locationId?.name,
      locationFlag: server.locationId?.flag
    };

    delete responsePayload.eggId;
    delete responsePayload.locationId;

    return responsePayload;
  }
}

module.exports = new ServerService();
