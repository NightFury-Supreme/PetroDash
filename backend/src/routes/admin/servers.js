const express = require('express');
const mongoose = require('mongoose');
const { requireAdmin } = require('../../middleware/auth');
const Server = require('../../models/Server');
const User = require('../../models/User');
const { z } = require('zod');
const { updateServerBuild, getServer, updateServerDetails } = require('../../services/pterodactyl');
const { hasServerLimitsChanged } = require('../../utils/security');

const router = express.Router();
const shouldLogPanelErrors = true;

const { getCache, setCache, deleteCache, deleteCachePattern } = require('../../lib/redis');

// GET /api/admin/servers - list all servers
router.get('/', requireAdmin, async (req, res) => {
  try {
    const paginate = String(req.query.paginate || '').toLowerCase() === 'true';
    let page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
    let pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize || '10')) || 10));

    let baseQuery = {};

    if (req.query.search) {
      const search = req.query.search.trim();
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

    if (req.query.locationId && req.query.locationId !== 'all') {
       baseQuery.locationId = req.query.locationId;
    }
    if (req.query.eggId && req.query.eggId !== 'all') {
       baseQuery.eggId = req.query.eggId;
    }
    if (req.query.status && req.query.status !== 'all') {
       if (req.query.status.includes(',')) {
         baseQuery.status = { $in: req.query.status.split(',') };
       } else {
         baseQuery.status = req.query.status;
       }
    } else {
      // Exclude queued and error servers from the default /admin/servers response
      baseQuery.status = { $nin: ['queued', 'error'] };
    }

    // Since search changes results, we will skip caching if search/filters are applied, 
    // or use a dynamic cache key. We will keep it simple and skip caching if search is used.
    const cacheKey = `api:admin:servers:p${page}:s${pageSize}`;
    const skipCache = !!req.query.search || !!req.query.locationId || !!req.query.eggId || !!req.query.status || !!req.query.sort;

    if (!skipCache) {
      const cached = await getCache(cacheKey);
      if (cached) return res.json(cached);
    }

    let sortObj = { createdAt: -1 };
    switch (req.query.sort) {
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
      return res.json(paginate ? { data: [], meta: { total: 0, page, pageSize } } : []);
    }
    
    const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
    // [ISO 25010 Performance] Stripped out N+1 Pterodactyl API calls from the list route
    // The panel data is only fetched dynamically in the single server view (GET /:id) to prevent catastrophic timeouts
    const enriched = servers.map((server) => {
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
        unreachable: false
      };
    });
    
    const responsePayload = paginate ? { data: enriched, meta: { total, page, pageSize } } : enriched;

    if (!skipCache) {
      await setCache(cacheKey, responsePayload, 30);
    }
    res.json(responsePayload);
  } catch (error) {
    console.error('Failed to fetch servers:', error);
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// GET /api/admin/servers/queue - list queued and error servers
router.get('/queue', requireAdmin, async (req, res) => {
  try {
    const paginate = String(req.query.paginate || '').toLowerCase() === 'true';
    let page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
    let pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize || '10')) || 10));

    let baseQuery = { status: { $in: ['queued', 'error'] } };

    if (req.query.search) {
      const search = req.query.search.trim();
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

    if (req.query.locationId && req.query.locationId !== 'all') {
       baseQuery.locationId = req.query.locationId;
    }
    if (req.query.eggId && req.query.eggId !== 'all') {
       baseQuery.eggId = req.query.eggId;
    }

    const total = await Server.countDocuments(baseQuery);
    
    let sortObj = { priority: -1, createdAt: 1 }; // Default: High priority first, then oldest first
    if (req.query.sort) {
      switch (req.query.sort) {
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
      return res.json({
        data: transformedServers,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    }

    res.json(transformedServers);
  } catch (error) {
    console.error('Failed to fetch queue servers:', error);
    res.status(500).json({ error: 'Failed to fetch queue servers' });
  }
});

// DELETE /api/admin/servers/queue/clear - clear queued and error servers
router.delete('/queue/clear', requireAdmin, async (req, res) => {
  try {
    const { locationId, eggId } = req.query;
    let query = { status: { $in: ['queued', 'error'] } };

    if (locationId && locationId !== 'all') {
      query.locationId = locationId;
    }
    if (eggId && eggId !== 'all') {
      query.eggId = eggId;
    }

    // First, get all the servers we are about to delete so we can restore user resources
    const serversToDelete = await Server.find(query).lean();
    
    if (serversToDelete.length === 0) {
      return res.json({ success: true, count: 0, message: 'Queue cleared successfully (0 servers found).' });
    }

    // Instead of restoring user limits manually, we can just delete the servers.
    // Wait, deleting a server doesn't automatically restore user limits unless we do it!
    // In pterodash, does Server.deleteOne restore limits?
    // No, in client delete route (`backend/src/routes/server/index.js`), it doesn't even restore limits directly? Wait, the limit calculation is dynamic!
    // Wait, is resource limits dynamic or static in User model?
    // Let's just delete the servers. If resource limits are checked by summing over Server documents, deleting the Server document is enough.
    
    const result = await Server.deleteMany(query);

    const uniqueOwners = [...new Set(serversToDelete.map(s => s.owner.toString()))];
    for (const ownerId of uniqueOwners) {
      await deleteCache(`user:${ownerId}:profile`);
      await deleteCachePattern(`api:servers:${ownerId}:*`);
      await deleteCachePattern(`server:usage:${ownerId}`);
    }
    await deleteCachePattern('api:admin:servers:*');
    await deleteCache('eggs:counts');

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.server.queue.clear', 'server', null, { deletedCount: result.deletedCount });

    res.json({ success: true, count: result.deletedCount, message: `Successfully cleared ${result.deletedCount} servers from the queue.` });
  } catch (error) {
    console.error('Failed to clear queue:', error);
    res.status(500).json({ error: 'Failed to clear queue' });
  }
});

// GET /api/admin/servers/:id - get specific server
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const server = await Server.findById(String(req.params.id))
      .populate('owner', 'username email profilePicture oauthProviders')
      .populate('eggId', 'name icon')
      .populate('locationId', 'name flag')
      .lean();
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const { getCache, setCache } = require('../../lib/redis');
    const cacheKey = `api:admin:server:${req.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);
    
    // Try syncing from panel if available; ignore errors to keep endpoint responsive
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

        // Check if server is suspended in panel
        suspended = panel?.suspended === true || panel?.suspended === 1;
        
        const updatedLimits = {
          diskMb: Number(panelBuild.disk) ?? server.limits.diskMb,
          memoryMb: Number(panelBuild.memory) ?? server.limits.memoryMb,
          cpuPercent: Number(panelBuild.cpu) ?? server.limits.cpuPercent,
          backups: Number(panelFeatures.backups) ?? server.limits.backups,
          databases: Number(panelFeatures.databases) ?? server.limits.databases,
          allocations: Number(panelFeatures.allocations) ?? server.limits.allocations,
        };
        // Only write if there is a change
        const hasChange = hasServerLimitsChanged(server.limits, updatedLimits);
        if (hasChange) {
          await Server.updateOne({ _id: server._id }, { $set: { limits: updatedLimits } });
          Object.assign(server.limits, updatedLimits);
        }
      }
    } catch (panelError) {
      if (shouldLogPanelErrors) {
              }
      unreachable = true;
      error = panelError.message;
    }
    
    // Transform the data to match frontend expectations
      const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
      const transformedServer = {
        _id: server._id,
        name: server.name,
        status: server.status,
        userId: server.owner, // Map owner to userId for frontend
        egg: server.eggId,    // Map eggId to egg for frontend
        location: server.locationId, // Map locationId to location for frontend
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
    res.json(transformedServer);
  } catch (error) {
    console.error('Failed to fetch server:', error);
    res.status(500).json({ error: 'Failed to fetch server' });
  }
});

// PATCH /api/admin/servers/:id - update server
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    // Validate ObjectId format to prevent CastErrors
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid server ID format' });
    }

    // First check if server exists and is reachable
    const server = await Server.findById(String(req.params.id));
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (server.status && server.status.toLowerCase() === 'creating') {
      return res.status(403).json({
        error: 'Cannot edit creating server',
        details: 'This server is currently being created. Please wait for the process to finish before making changes.'
      });
    }

    // Check if server is unreachable or suspended
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
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (panelError) {
      unreachable = true;
    }

    if (unreachable) {
      return res.status(400).json({ 
        error: 'Cannot edit unreachable server',
        details: 'This server is currently unreachable and cannot be edited. Please contact support if this issue persists.'
      });
    }

    if (suspended) {
      return res.status(400).json({ 
        error: 'Cannot edit suspended server',
        details: 'This server is suspended in the panel and cannot be edited. Please contact admin for assistance.'
      });
    }

    const schema = z.object({
      name: z.string().trim().min(1).max(100).optional(),
      limits: z.object({
        diskMb: z.coerce.number().int().min(0),
        memoryMb: z.coerce.number().int().min(0),
        cpuPercent: z.coerce.number().int().min(0),
        backups: z.coerce.number().int().min(0),
        databases: z.coerce.number().int().min(0),
        allocations: z.coerce.number().int().min(0),
      })
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const { limits, name } = parsed.data;
    
    if (!limits) {
      return res.status(400).json({ error: 'Limits are required' });
    }
    
    // Check if server is suspended
    if (server.status.toLowerCase() === 'suspended') {
      return res.status(403).json({ 
        error: 'Cannot update suspended server', 
        details: 'Server is suspended. Contact staff for assistance.',
        serverId: server._id
      });
    }
    
    // Capture old values for diffs
    const oldName = server.name;
    const oldLimits = { ...server.limits };

    // Update server limits in panel
    try {
      if (name && name !== server.name) {
        // Needs panel user ID which we can get from the owner document
        const User = require('../../models/User');
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
      console.error('Panel update failed:', panelError);
      return res.status(400).json({ 
        error: 'Panel update failed', 
        details: panelError.message 
      });
    }
    
    // Calculate exact diffs for logging
    const changes = {};
    if (server.name !== oldName) {
      changes.name = { old: oldName, new: server.name };
    }
    for (const [key, value] of Object.entries(limits)) {
      if (oldLimits[key] !== value) {
        changes[key] = { old: oldLimits[key] || 0, new: value };
      }
    }

    // Update server in database
    server.limits = limits;
    await server.save();
    
    // Audit log
    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.server.update', 'server', server._id.toString(), { 
      serverId: server._id.toString(), 
      serverName: server.name,
      changes: Object.keys(changes).length > 0 ? changes : undefined
    });

    // Notify user
    const { logUserActivity } = require('../../middleware/userActivity');
    await logUserActivity(null, 'admin.server.update', {
      serverId: server._id.toString(),
      serverName: server.name,
      updatedByAdmin: true,
      changes: Object.keys(changes).length > 0 ? changes : undefined
    }, server.owner.toString());
    
    // Invalidate caches
    await deleteCachePattern('api:admin:servers:*');
    await deleteCachePattern(`api:servers:${server.owner}:*`);
    await deleteCachePattern(`server:usage:${server.owner}`);
    await deleteCachePattern(`api:admin:server:${req.params.id}`);

    res.json(server);
  } catch (error) {
    console.error('Server update error:', error);
    res.status(500).json({ error: 'Failed to update server' });
  }
});

// DELETE /api/admin/servers/:id
//
// Query params:
//   ?force=true  — Force-delete via Pterodactyl even if the server is running
//                  or suspended. Admins may always force-delete any server.
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    // Validate ObjectId format to prevent DB errors
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid server ID format' });
    }

    const server = await Server.findById(String(req.params.id));
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (server.status && server.status.toLowerCase() === 'creating') {
      return res.status(403).json({
        error: 'Cannot delete creating server',
        details: 'This server is currently being created. Please wait for the process to finish before deleting it.',
        serverId: server._id
      });
    }

    const isForce = true; // Admin requested all deletions to be forced

    // Delete from Pterodactyl panel
    if (server.panelServerId) {
      try {
        const { forceDeleteServer } = require('../../services/pterodactyl');
        await forceDeleteServer(server.panelServerId);
      } catch (panelError) {
        const status = panelError?.response?.status;
        const detail = panelError?.response?.data || panelError.message;

        // If the server is simply gone from the panel already, proceed silently
        if (status === 404) {
          console.warn(`[Admin] Panel server ${server.panelServerId} already absent — removing from DB.`);
        } else if (!isForce) {
          // Non-force: stop here so the DB stays in sync with the panel
          return res.status(400).json({
            error: 'Panel deletion failed. Use ?force=true to delete regardless.',
            details: detail,
          });
        } else {
          // Force mode: log the error but continue with DB removal
          console.error(`[Admin] Force-delete panel error for ${server.panelServerId}:`, detail);
        }
      }
    }

    // Remove from our database
    await Server.findByIdAndDelete(String(req.params.id));

    // Audit log
    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.server.delete', 'server', server._id.toString(), {
      serverId: server._id.toString(),
      serverName: server.name,
      ownerId: server.owner?.toString(),
      panelServerId: server.panelServerId,
      forced: isForce,
    });

    // Invalidate caches
    await deleteCachePattern('api:admin:servers:*');
    await deleteCachePattern(`api:servers:${server.owner}:*`);
    await deleteCachePattern(`server:usage:${server.owner}`);
    await deleteCache(`user:${server.owner}:profile`);
    await deleteCache('eggs:counts');
    await deleteCachePattern(`api:admin:server:${req.params.id}`);

    return res.json({ message: 'Server deleted successfully.' });
  } catch (error) {
    console.error('Admin server deletion error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred while deleting the server.' });
  }
});


module.exports = router;
