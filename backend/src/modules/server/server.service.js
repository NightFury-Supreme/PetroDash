const Server = require('../../models/Server');
const User = require('../../models/User');
const { getCache, getCacheMany, setCache, getOrSetCache, publishEvent } = require('../../lib/redis');
const { getServer: getPanelServer } = require('../../services/pterodactyl');
const { reconcileServerWithPanel, handlePanelServerDeleted } = require('../../utils/serverReconciler');
const AppError = require('../../utils/AppError');
const { buildIdFilter } = require('../../utils/publicId');

class ServerService {
  async getUsage(userId) {
    const user = await User.findOne(buildIdFilter(userId)).select('_id').lean();
    if (!user) {
      return { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0, servers: 0 };
    }
    const ownerId = user._id;
    const cacheKey = `server:usage:${userId}`;
    return getOrSetCache(cacheKey, async () => {
      const result = await Server.aggregate([
        { $match: { owner: ownerId } },
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

      const { _id, ...usage } = result[0] || {
        diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0, servers: 0
      };
      return usage;
    }, 60);
  }

  async listServers(userId, paginate, page, pageSize) {
    const user = await User.findOne(buildIdFilter(userId)).select('_id').lean();
    if (!user) {
      return paginate ? { data: [], meta: { total: 0, page: 1, pageSize: 20 } } : [];
    }
    const ownerId = user._id;
    const cacheKey = `api:servers:${userId}:${paginate}:${page}:${pageSize}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const baseQuery = { owner: ownerId };
    
    let listQuery = Server.find(baseQuery)
      .select('name status priority createdAt limits eggId locationId publicId panelServerId identifier')
      .sort({ createdAt: -1 })
      .populate('eggId', 'name icon publicId')
      .populate('locationId', 'name flag publicId')
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
    const uniqueLocIds = [...new Set(list.map((s) => s.locationId?.publicId).filter(Boolean))];
    const pingKeys = ['ping:panel', ...uniqueLocIds.map((id) => `ping:${id}`)];
    const pings = await getCacheMany(pingKeys);
    const panelPingData = pings[0];
    const isPanelDown = Boolean(panelPingData && panelPingData.ping === -1);
    const locationDownMap = new Map();
    uniqueLocIds.forEach((locId, idx) => {
      const p = pings[idx + 1];
      locationDownMap.set(locId, Boolean(p && p.ping === -1));
    });

    const queuedServers = list.some((s) => s.status === 'queued')
      ? await Server.find({ status: 'queued' })
          .select('_id priority createdAt')
          .sort({ priority: -1, createdAt: 1 })
          .lean()
      : [];

    const enriched = await Promise.all(list.map(async (s) => {
        let status = s.status || 'unknown';
        if (status === 'creating' && s.panelServerId) {
          try {
            const panelResponse = await getPanelServer(s.panelServerId);
            const panel = panelResponse?.attributes;
            if (panel) {
              const isInstalling = panel.status === 'installing' || panel?.container?.installed === false || panel?.container?.installed === 0;
              if (!isInstalling) {
                status = 'active';
                await Server.updateOne({ _id: s._id }, { $set: { status: 'active' } });
                await publishEvent(`user:${userId}:servers`, { type: 'SERVER_ACTIVE', serverId: s.publicId });
              }
            }
          } catch (_panelCheckErr) {}
        }
        const suspended = status === 'suspended';
        const locPubId = s.locationId?.publicId;
        const isNodeDown = locPubId ? Boolean(locationDownMap.get(locPubId)) : false;
        const isUnreachable = isPanelDown || isNodeDown;
        
        let queuePosition = null;
        if (status === 'queued') {
          const index = queuedServers.findIndex((q) => String(q._id) === String(s._id));
          queuePosition = index !== -1 ? index + 1 : 1;
        }

        const clientUrl = s.identifier ? `${base}/server/${s.identifier}` : base;
        const publicId = s.publicId;
        
        return {
          id: publicId,
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
          clientUrl,
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

  async getServer(userId, serverId) {
    const user = await User.findOne(buildIdFilter(userId)).select('_id publicId').lean();
    if (!user) throw AppError.notFound('Server not found', 'ERR_SERVER_NOT_FOUND');
    const ownerId = user._id;

    const server = await Server.findOne({ ...buildIdFilter(serverId), owner: ownerId })
      .populate('owner', 'publicId pterodactylUserId username email')
      .populate('eggId', 'name icon publicId pterodactylEggId')
      .populate('locationId', 'name flag publicId platform')
      .lean();
    if (!server) throw AppError.notFound('Server not found', 'ERR_SERVER_NOT_FOUND');

    let unreachable = false;

    if (server.panelServerId) {
      try {
        const panelResponse = await getPanelServer(server.panelServerId);
        const panel = panelResponse?.attributes;
        if (panel) {
          await reconcileServerWithPanel(server, panel);
        }
      } catch (panelError) {
        if (panelError?.response?.status === 404) {
          await handlePanelServerDeleted(server);
          throw AppError.notFound('Server not found', 'ERR_SERVER_NOT_FOUND');
        }
        unreachable = true;
        if (server.status !== 'suspended' && !server.suspended) {
          server.status = 'unreachable';
        }
      }
    }

    if (server.owner && String(server.owner._id) !== String(ownerId)) {
      throw AppError.notFound('Server not found', 'ERR_SERVER_NOT_FOUND');
    }

    const suspended = Boolean(server.status === 'suspended' || server.suspended === true);
    const { _id: _dbId, __v: _version, publicId, eggId, locationId, owner: _owner, ...serverData } = server;
    const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
    const clientUrl = server.identifier ? `${base}/server/${server.identifier}` : base;

    const responsePayload = {
      ...serverData,
      id: publicId,
      clientUrl,
      unreachable,
      suspended,
      error: unreachable ? 'ERR_PANEL_UNREACHABLE' : undefined,
      eggName: eggId?.name,
      eggIcon: eggId?.icon,
      location: locationId?.name,
      locationFlag: locationId?.flag
    };

    return responsePayload;
  }
}

module.exports = new ServerService();
