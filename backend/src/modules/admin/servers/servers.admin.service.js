const mongoose = require('mongoose');
const Server = require('../../../models/Server');
const User = require('../../../models/User');
const { getCache, setCache, deleteCache, deleteCachePattern } = require('../../../lib/redis');
const { updateServerBuild, getServer, updateServerDetails, forceDeleteServer } = require('../../../services/pterodactyl');
const { hasServerLimitsChanged } = require('../../../utils/security');
const AppError = require('../../../utils/AppError');

const shouldLogPanelErrors = true;

const listServers = async (query) => {
  const paginate = String(query.paginate || '').toLowerCase() === 'true';
  let page = Math.max(1, parseInt(String(query.page || '1')) || 1);
  let pageSize = Math.max(1, Math.min(100, parseInt(String(query.pageSize || '10')) || 10));

  let baseQuery = {};

  if (query.search) {
    const search = query.search.trim();
    const matchingUsers = await User.find({ email: { $regex: search, $options: 'i' } }).select('_id').lean();
    const userIds = matchingUsers.map(u => u._id);

    let isObjectId = false;
    try { if (mongoose.Types.ObjectId.isValid(search)) isObjectId = true; } catch {}

    let orClauses = [
      { name: { $regex: search, $options: 'i' } }
    ];
    
    if (userIds.length > 0) {
      orClauses.push({ owner: { $in: userIds } });
    }
    
    if (!isNaN(search) && search !== '') {
       orClauses.push({ panelServerId: Number(search) });
    }
    
    if (isObjectId) {
       orClauses.push({ _id: search });
    }
    
    baseQuery.$or = orClauses;
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

  if (!skipCache) {
    const cached = await getCache(cacheKey);
    if (cached) return cached;
  }

  let sortObj = { createdAt: -1 };
  switch (query.sort) {
    case 'name_asc': sortObj = { name: 1 }; break;
    case 'name_desc': sortObj = { name: -1 }; break;
    case 'cpu_desc': sortObj = { 'limits.cpuPercent': -1 }; break;
    case 'memory_desc': sortObj = { 'limits.memoryMb': -1 }; break;
    case 'disk_desc': sortObj = { 'limits.diskMb': -1 }; break;
    case 'created_desc': sortObj = { createdAt: -1 }; break;
    case 'created_asc': sortObj = { createdAt: 1 }; break;
    default: sortObj = { createdAt: -1 };
  }

  let q = Server.find(baseQuery)
    .populate('owner', 'username email profilePicture oauthProviders')
    .populate('eggId', 'name icon')
    .populate('locationId', 'name flag')
    .sort(sortObj);

  if (paginate) q = q.skip((page - 1) * pageSize).limit(pageSize);

  const [servers, total] = await Promise.all([
    q.lean(),
    paginate ? Server.countDocuments(baseQuery) : Promise.resolve(0)
  ]);
  
  if (!servers || servers.length === 0) {
    return paginate ? { data: [], meta: { total: 0, page, pageSize } } : [];
  }
  
  const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
  
  const panelPingData = await getCache('ping:panel');
  const isPanelDown = !panelPingData || panelPingData.ping === -1 || panelPingData.ping === null;
  
  const uniqueLocationIds = [...new Set(servers.map(s => s.locationId?._id?.toString()).filter(Boolean))];
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
      unreachable: isUnreachable
    };
  });
  
  const responsePayload = paginate ? { data: enriched, meta: { total, page, pageSize } } : enriched;

  if (!skipCache) {
    await setCache(cacheKey, responsePayload, 30);
  }
  return responsePayload;
};

const listQueuedServers = async (query) => {
  const paginate = String(query.paginate || '').toLowerCase() === 'true';
  let page = Math.max(1, parseInt(String(query.page || '1')) || 1);
  let pageSize = Math.max(1, Math.min(100, parseInt(String(query.pageSize || '10')) || 10));

  let baseQuery = { status: { $in: ['queued', 'error'] } };

  if (query.search) {
    const search = query.search.trim();
    const matchingUsers = await User.find({ email: { $regex: search, $options: 'i' } }).select('_id').lean();
    const userIds = matchingUsers.map(u => u._id);

    let isObjectId = false;
    try { if (mongoose.Types.ObjectId.isValid(search)) isObjectId = true; } catch {}

    let orClauses = [
      { name: { $regex: search, $options: 'i' } }
    ];
    
    if (userIds.length > 0) {
      orClauses.push({ owner: { $in: userIds } });
    }
    
    if (isObjectId) {
       orClauses.push({ _id: search });
    }
    
    baseQuery.$or = orClauses;
  }

  if (query.locationId && query.locationId !== 'all') {
     baseQuery.locationId = query.locationId;
  }
  if (query.eggId && query.eggId !== 'all') {
     baseQuery.eggId = query.eggId;
  }

  const total = await Server.countDocuments(baseQuery);
  
  let sortObj = { priority: -1, createdAt: 1 };
  if (query.sort) {
    switch (query.sort) {
      case 'name_asc': sortObj = { name: 1 }; break;
      case 'name_desc': sortObj = { name: -1 }; break;
      case 'cpu_desc': sortObj = { 'limits.cpuPercent': -1 }; break;
      case 'memory_desc': sortObj = { 'limits.memoryMb': -1 }; break;
      case 'disk_desc': sortObj = { 'limits.diskMb': -1 }; break;
      case 'created_desc': sortObj = { priority: -1, createdAt: -1 }; break;
      case 'created_asc': sortObj = { priority: -1, createdAt: 1 }; break;
    }
  }

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

  const transformedServers = servers.map(server => ({
    _id: server._id,
    name: server.name,
    status: server.status,
    priority: server.priority || 0,
    userId: server.owner ? {
      _id: server.owner._id,
      username: server.owner.username,
      email: server.owner.email,
      profilePicture: server.owner.profilePicture,
      oauthProviders: server.owner.oauthProviders
    } : null,
    egg: server.eggId ? {
      _id: server.eggId._id,
      name: server.eggId.name,
      icon: server.eggId.icon
    } : null,
    location: server.locationId ? {
      _id: server.locationId._id,
      name: server.locationId.name,
      flag: server.locationId.flag
    } : null,
    limits: server.limits || {
      diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0
    },
    createdAt: server.createdAt,
    suspended: server.suspended || false
  }));

  if (paginate) {
    return {
      data: transformedServers,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  return transformedServers;
};

const clearQueue = async (query) => {
  const { locationId, eggId } = query;
  let q = { status: { $in: ['queued', 'error'] } };

  if (locationId && locationId !== 'all') {
    q.locationId = locationId;
  }
  if (eggId && eggId !== 'all') {
    q.eggId = eggId;
  }

  const serversToDelete = await Server.find(q).lean();
  
  if (serversToDelete.length === 0) {
    return { success: true, count: 0, message: 'Queue cleared successfully (0 servers found).' };
  }
  
  const result = await Server.deleteMany(q);

  const uniqueOwners = [...new Set(serversToDelete.map(s => s.owner.toString()))];
  for (const ownerId of uniqueOwners) {
    await deleteCache(`user:${ownerId}:profile`);
    await deleteCachePattern(`api:servers:${ownerId}:*`);
    await deleteCachePattern(`server:usage:${ownerId}`);
  }
  await deleteCachePattern('api:admin:servers:*');
  await deleteCache('eggs:counts');

  return { deletedCount: result.deletedCount, success: true, count: result.deletedCount, message: `Successfully cleared ${result.deletedCount} servers from the queue.` };
};

const getServerDetails = async (id) => {
  const server = await Server.findById(String(id))
    .populate('owner', 'username email profilePicture oauthProviders')
    .populate('eggId', 'name icon')
    .populate('locationId', 'name flag')
    .lean();
  
  if (!server) {
    throw new AppError('Server not found', 404, 'SERVER_NOT_FOUND');
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
    panelUrl: base
  };
  
  await setCache(cacheKey, transformedServer, 30);
  return transformedServer;
};

const updateServer = async (id, data) => {
  const { limits, name } = data;

  const server = await Server.findById(String(id));
  if (!server) {
    throw new AppError('Server not found', 404, 'SERVER_NOT_FOUND');
  }

  if (server.status && server.status.toLowerCase() === 'creating') {
    throw new AppError('Cannot edit creating server. This server is currently being created. Please wait for the process to finish before making changes.', 403, 'SERVER_CREATING');
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
    throw new AppError('Cannot edit unreachable server. This server is currently unreachable and cannot be edited. Please contact support if this issue persists.', 400, 'SERVER_UNREACHABLE');
  }

  if (suspended) {
    throw new AppError('Cannot edit suspended server. This server is suspended in the panel and cannot be edited. Please contact admin for assistance.', 400, 'SERVER_SUSPENDED');
  }

  if (server.status.toLowerCase() === 'suspended') {
    throw new AppError('Cannot update suspended server. Server is suspended. Contact staff for assistance.', 403, 'SERVER_SUSPENDED');
  }
  
  const oldName = server.name;
  const oldLimits = { ...server.limits };

  try {
    if (name && name !== server.name) {
      const user = await User.findById(server.owner);
      if (user && user.pterodactylUserId) {
        await updateServerDetails(server.panelServerId, {
          name: name,
          user: user.pterodactylUserId,
          external_id: user._id.toString()
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
      oom_disabled: false
    });
  } catch (panelError) {
    throw new AppError(`Panel update failed: ${panelError.message}`, 400, 'PANEL_UPDATE_FAILED');
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
  
  const { logUserActivity } = require('../../../middleware/userActivity');
  await logUserActivity(null, 'admin.server.update', {
    serverId: server._id.toString(),
    serverName: server.name,
    updatedByAdmin: true,
    changes: Object.keys(changes).length > 0 ? changes : undefined
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
    throw new AppError('Server not found', 404, 'SERVER_NOT_FOUND');
  }

  if (server.status && server.status.toLowerCase() === 'creating') {
    throw new AppError('Cannot delete creating server. This server is currently being created. Please wait for the process to finish before deleting it.', 403, 'SERVER_CREATING');
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
        throw new AppError(`Panel deletion failed. Use ?force=true to delete regardless. Details: ${detail}`, 400, 'PANEL_DELETION_FAILED');
      } else {
        console.error(`[Admin] Force-delete panel error for ${server.panelServerId}:`, detail);
      }
    }
  }

  await Server.findByIdAndDelete(String(id));

  await deleteCachePattern('api:admin:servers:*');
  await deleteCachePattern(`api:servers:${server.owner}:*`);
  await deleteCachePattern(`server:usage:${server.owner}`);
  await deleteCache(`user:${server.owner}:profile`);
  await deleteCache('eggs:counts');
  await deleteCachePattern(`api:admin:server:${id}`);

  return server;
};

module.exports = {
  listServers,
  listQueuedServers,
  clearQueue,
  getServerDetails,
  updateServer,
  deleteServer
};
