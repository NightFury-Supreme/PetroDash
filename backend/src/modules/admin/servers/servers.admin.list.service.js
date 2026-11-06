const Server = require('../../../models/Server');
const { getCache, getOrSetCache, getCacheMany } = require('../../../lib/redis');
const { getServer } = require('../../../services/pterodactyl');
const { reconcileServerWithPanel, handlePanelServerDeleted } = require('../../../utils/serverReconciler');
const AppError = require('../../../utils/AppError');
const { buildServerSearchClauses, buildServerSort } = require('./servers.admin.query.helpers');
const { buildIdFilter, formatPublicEntity } = require('../../../utils/publicId');
const avatarService = require('../../../services/avatarService');

const listServers = async (query = {}) => {
  const paginate = String(query.paginate || '').toLowerCase() === 'true';
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const pageSize = Math.max(1, Math.min(100, parseInt(String(query.pageSize || '10'), 10) || 10));

  const baseQuery = {};

  if (query.search) {
    const orClauses = await buildServerSearchClauses(query.search);
    if (orClauses) baseQuery.$or = orClauses;
  }

  if (query.locationId && query.locationId !== 'all') {
    baseQuery.locationId = query.locationId;
  }
  if (query.eggId && query.eggId !== 'all') {
    baseQuery.eggId = query.eggId;
  }
  if (query.status && query.status !== 'all') {
    if (query.status.includes(',')) {
      baseQuery.status = { $in: query.status.split(',') };
    } else {
      baseQuery.status = query.status;
    }
  } else {
    baseQuery.status = { $nin: ['queued', 'error'] };
  }

  const cacheKey = `api:admin:servers:p${page}:s${pageSize}`;
  const skipCache = !!query.search || !!query.locationId || !!query.eggId || !!query.status || !!query.sort;

  const fetchServers = async () => {
    const sortObj = buildServerSort(query.sort, false);

    let q = Server.find(baseQuery)
      .populate('owner', 'username email profilePicture oauthProviders publicId')
      .populate('eggId', 'name icon publicId')
      .populate('locationId', 'name flag publicId')
      .sort(sortObj);

    if (paginate) q = q.skip((page - 1) * pageSize).limit(pageSize);

    const [servers, total] = await Promise.all([
      q.lean(),
      paginate ? Server.countDocuments(baseQuery) : Promise.resolve(0),
    ]);

    if (!servers || servers.length === 0) {
      return paginate ? { data: [], meta: { total: 0, page, pageSize } } : [];
    }

    const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
    const panelPingData = await getCache('ping:panel');
    const isPanelDown = Boolean(panelPingData && panelPingData.ping === -1);

    const uniqueLocationIds = [...new Set(servers.map((s) => s.locationId?.publicId).filter(Boolean))];
    const locationPingStatus = {};

    if (uniqueLocationIds.length > 0) {
      const nodePings = await getCacheMany(uniqueLocationIds.map((locId) => `ping:${locId}`));
      uniqueLocationIds.forEach((locId, idx) => {
        const nodePing = nodePings[idx];
        locationPingStatus[locId] = Boolean(nodePing && nodePing.ping === -1);
      });
    }

    const enriched = servers.map((server) => {
      let isNodeDown = false;
      if (server.locationId && server.locationId.publicId) {
        isNodeDown = locationPingStatus[server.locationId.publicId] || false;
      }

      const isUnreachable = isPanelDown || isNodeDown;
      const pubId = server.publicId;
      const owner = server.owner ? formatPublicEntity(server.owner, 'user') : null;
      if (owner) owner.profilePicture = avatarService.resolveAvatar(server.owner);
      const egg = server.eggId ? formatPublicEntity(server.eggId, 'egg') : null;
      const location = server.locationId ? formatPublicEntity(server.locationId, 'location') : null;

      return {
        id: pubId,
        name: server.name,
        status: server.status || 'unknown',
        userId: owner,
        egg,
        location,
        limits: server.limits,
        createdAt: server.createdAt,
        clientUrl: server.identifier ? `${base}/server/${server.identifier}` : `${base}`,
        suspended: server.status === 'suspended' || server.suspended === true,
        suspendedUntil: server.suspendedUntil || null,
        suspensionReason: server.suspensionReason || null,
        unreachable: isUnreachable,
      };
    });

    return paginate ? { data: enriched, meta: { total, page, pageSize } } : enriched;
  };

  if (!skipCache) {
    return getOrSetCache(cacheKey, fetchServers, 30);
  }
  return fetchServers();
};

const listQueuedServers = async (query = {}) => {
  const paginate = String(query.paginate || '').toLowerCase() === 'true';
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const pageSize = Math.max(1, Math.min(100, parseInt(String(query.pageSize || '10'), 10) || 10));

  const baseQuery = { status: { $in: ['queued', 'error'] } };

  if (query.search) {
    const orClauses = await buildServerSearchClauses(query.search);
    if (orClauses) baseQuery.$or = orClauses;
  }

  if (query.locationId && query.locationId !== 'all') {
    baseQuery.locationId = query.locationId;
  }
  if (query.eggId && query.eggId !== 'all') {
    baseQuery.eggId = query.eggId;
  }

  const total = await Server.countDocuments(baseQuery);

  const sortObj = buildServerSort(query.sort, true);

  let q = Server.find(baseQuery)
    .sort(sortObj)
    .populate('owner', 'username email profilePicture oauthProviders publicId')
    .populate('eggId', 'name icon publicId')
    .populate('locationId', 'name flag publicId')
    .lean();

  if (paginate) {
    q = q.skip((page - 1) * pageSize).limit(pageSize);
  }

  const servers = await q.exec();

  const transformedServers = servers.map((server) => {
    const pubId = server.publicId;
    return {
      id: pubId,
      name: server.name,
      status: server.status,
      priority: server.priority || 0,
      userId: server.owner ? {
        id: server.owner.publicId,
        username: server.owner.username,
        email: server.owner.email,
        profilePicture: avatarService.resolveAvatar(server.owner),
        oauthProviders: server.owner.oauthProviders,
      } : null,
      egg: server.eggId ? {
        id: server.eggId.publicId,
        name: server.eggId.name,
        icon: server.eggId.icon,
      } : null,
      location: server.locationId ? {
        id: server.locationId.publicId,
        name: server.locationId.name,
        flag: server.locationId.flag,
      } : null,
      limits: server.limits || {
        diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0,
      },
      createdAt: server.createdAt,
      suspended: server.suspended || false,
    };
  });

  if (paginate) {
    return {
      data: transformedServers,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  return transformedServers;
};

const getServerDetails = async (id) => {
  const server = await Server.findOne(buildIdFilter(id))
    .populate('owner', 'username email profilePicture oauthProviders publicId pterodactylUserId')
    .populate('eggId', 'name icon publicId pterodactylEggId')
    .populate('locationId', 'name flag publicId platform')
    .lean();

  if (!server) {
    throw AppError.notFound('Server not found', 'ERR_SERVER_NOT_FOUND');
  }

  const pubId = server.publicId;
  const cacheKey = `api:admin:server:${pubId}`;

  return getOrSetCache(cacheKey, async () => {
    let unreachable = false;
    let identifier = null;
    let uuid = null;
    try {
      if (server.panelServerId) {
        const panelResponse = await getServer(server.panelServerId);
        const panel = panelResponse?.attributes;
        if (panel) {
          await reconcileServerWithPanel(server, panel);
        }
        identifier = panel?.identifier || server.identifier || null;
        uuid = panel?.uuid || null;
      }
    } catch (panelError) {
      if (panelError?.response?.status === 404) {
        await handlePanelServerDeleted(server);
        throw AppError.notFound('Server not found', 'ERR_SERVER_NOT_FOUND');
      }
      unreachable = true;
    }

    const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
    const suspended = Boolean(server.status === 'suspended' || server.suspended === true);
    return {
      id: pubId,
      name: server.name,
      status: server.status,
      userId: server.owner ? formatPublicEntity(server.owner, 'user') : null,
      egg: server.eggId ? formatPublicEntity(server.eggId, 'egg') : null,
      location: server.locationId ? formatPublicEntity(server.locationId, 'location') : null,
      limits: server.limits,
      createdAt: server.createdAt,
      unreachable,
      suspended,
      suspendedUntil: server.suspendedUntil || null,
      suspensionReason: server.suspensionReason || null,
      identifier,
      uuid,
      clientUrl: identifier ? `${base}/server/${identifier}` : `${base}`,
      panelUrl: base,
    };
  }, 30);
};

module.exports = {
  listServers,
  listQueuedServers,
  getServerDetails,
};
