/**
 * Server Service Layer (Dashboard Focus)
 * Optimized DB queries, strictly no Pterodactyl blocking calls.
 */

const Server = require('../../models/Server');
const { getCache, setCache } = require('../../lib/redis');
const mongoose = require('mongoose');

class ServerService {
  /**
   * DB-Optimized Aggregation for Server Resource Usage
   */
  async getUsage(userId) {
    const cacheKey = `server:usage:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    // Use MongoDB aggregation instead of pulling all documents and looping
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

    // Remove _id from result
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
        let status = s.status || 'unknown';
        let suspended = status === 'suspended';
        
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
}

module.exports = new ServerService();
