/* ==========================================================================
   Admin Servers Query / List Service Layer
   Compliance: ISO/IEC 25010, Single Responsibility Principle
========================================================================== */

const Server = require('../../../models/Server');
const { getCache, setCache } = require('../../../lib/redis');
const { getServer } = require('../../../services/pterodactyl');
const { hasServerLimitsChanged } = require('../../../utils/security');
const AppError = require('../../../utils/AppError');
const { buildServerSearchClauses, buildServerSort } = require('./servers.admin.query.helpers');

const shouldLogPanelErrors = true;

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
  const skipCache = query.refresh === 'true' || !!query.search || !!query.locationId || !!query.eggId || !!query.status || !!query.sort;

  if (!skipCache) {
    const cached = await getCache(cacheKey);
    if (cached) return cached;
  }

  const sortObj = buildServerSort(query.sort, false);

  let q = Server.find(baseQuery)
    .populate('owner', 'username email profilePicture oauthProviders')
    .populate('eggId', 'name icon')
    .populate('locationId', 'name flag')
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
  const isPanelDown = !panelPingData || panelPingData.ping === -1 || panelPingData.ping === null;

  const uniqueLocationIds = [...new Set(servers.map((s) => s.locationId?._id?.toString()).filter(Boolean))];
  const locationPingStatus = {};

  for (const locId of uniqueLocationIds) {
    const nodePing = await getCache(`ping:${locId}`);
    locationPingStatus[locId] = !nodePing || nodePing.ping === -1 || nodePing.ping === null;
  }

  const enriched = servers.map((server) => {
    let isNodeDown = false;
    if (server.locationId && server.locationId._id) {
      isNodeDown = locationPingStatus[server.locationId._id.toString()] || false;
    }

    const isUnreachable = isPanelDown || isNodeDown;

    return {
      _id: server._id,
      name: server.name,
      status: server.status || 'unknown',
      userId: server.owner,
      egg: server.eggId,
      location: server.locationId,
      limits: server.limits,
      createdAt: server.createdAt,
      clientUrl: `${base}`,
      suspended: server.status === 'suspended',
      unreachable: isUnreachable,
    };
  });

  const responsePayload = paginate ? { data: enriched, meta: { total, page, pageSize } } : enriched;

  if (!skipCache) {
    await setCache(cacheKey, responsePayload, 30);
  }
  return responsePayload;
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
    .populate('owner', 'username email profilePicture oauthProviders')
    .populate('eggId', 'name icon')
    .populate('locationId', 'name flag')
    .lean();

  if (paginate) {
    q = q.skip((page - 1) * pageSize).limit(pageSize);
  }

  const servers = await q.exec();

  const transformedServers = servers.map((server) => ({
    _id: server._id,
    name: server.name,
    status: server.status,
    priority: server.priority || 0,
    userId: server.owner ? {
      _id: server.owner._id,
      username: server.owner.username,
      email: server.owner.email,
      profilePicture: server.owner.profilePicture,
      oauthProviders: server.owner.oauthProviders,
    } : null,
    egg: server.eggId ? {
      _id: server.eggId._id,
      name: server.eggId.name,
      icon: server.eggId.icon,
    } : null,
    location: server.locationId ? {
      _id: server.locationId._id,
      name: server.locationId.name,
      flag: server.locationId.flag,
    } : null,
    limits: server.limits || {
      diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0,
    },
    createdAt: server.createdAt,
    suspended: server.suspended || false,
  }));

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
  const server = await Server.findById(String(id))
    .populate('owner', 'username email profilePicture oauthProviders')
    .populate('eggId', 'name icon')
    .populate('locationId', 'name flag')
    .lean();

  if (!server) {
    throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
  }

  const cacheKey = `api:admin:server:${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  let unreachable = false;
  let error = null;
  let suspended = false;
  let identifier = null;
  let uuid = null;
  try {
    if (server.panelServerId) {
      const panelResponse = await getServer(server.panelServerId);
      const panel = panelResponse?.attributes;
      const panelBuild = panel?.limits || panel?.build || {};
      const panelFeatures = panel?.feature_limits || {};

      identifier = panel?.identifier || null;
      uuid = panel?.uuid || null;

      suspended = panel?.suspended === true || panel?.suspended === 1;

      const updatedLimits = {
        diskMb: Number(panelBuild.disk) ?? server.limits.diskMb,
        memoryMb: Number(panelBuild.memory) ?? server.limits.memoryMb,
        cpuPercent: Number(panelBuild.cpu) ?? server.limits.cpuPercent,
        backups: Number(panelFeatures.backups) ?? server.limits.backups,
        databases: Number(panelFeatures.databases) ?? server.limits.databases,
        allocations: Number(panelFeatures.allocations) ?? server.limits.allocations,
      };
      const hasChange = hasServerLimitsChanged(server.limits, updatedLimits);
      if (hasChange) {
        await Server.updateOne({ _id: server._id }, { $set: { limits: updatedLimits } });
        Object.assign(server.limits, updatedLimits);
      }
    }
  } catch (panelError) {
    if (shouldLogPanelErrors) {
      console.error(panelError);
    }
    unreachable = true;
    error = panelError.message;
  }

  const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
  const transformedServer = {
    _id: server._id,
    name: server.name,
    status: server.status,
    userId: server.owner,
    egg: server.eggId,
    location: server.locationId,
    limits: server.limits,
    createdAt: server.createdAt,
    unreachable,
    error: error || undefined,
    suspended,
    identifier,
    uuid,
    clientUrl: identifier ? `${base}/server/${identifier}` : `${base}`,
    panelUrl: base,
  };

  await setCache(cacheKey, transformedServer, 30);
  return transformedServer;
};

module.exports = {
  listServers,
  listQueuedServers,
  getServerDetails,
};
