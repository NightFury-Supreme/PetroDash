const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const Server = require('../../models/Server');
const { writeAudit } = require('../../middleware/audit');
const { z } = require('zod');
const { updateServerBuild, getServer } = require('../../services/pterodactyl');
const { hasServerLimitsChanged } = require('../../utils/security');

const router = express.Router();
const shouldLogPanelErrors = true;

const { getCache, setCache, deleteCachePattern } = require('../../lib/redis');

// GET /api/admin/servers - list all servers
router.get('/', requireAdmin, async (req, res) => {
  try {
    const cached = await getCache('api:admin:servers');
    if (cached) return res.json(cached);

    const servers = await Server.find({})
      .populate('owner', 'username email')
      .populate('eggId', 'name')
      .populate('locationId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    
    if (!servers || servers.length === 0) {
      return res.json([]);
    }
    
    const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
    const enriched = await Promise.all(servers.map(async (server) => {
      try {
        const panelResponse = server.panelServerId ? await getServer(server.panelServerId) : null;
        const panel = panelResponse?.attributes;
        const identifier = panel?.identifier || panel?.uuid || null;
        
        // Check if server is suspended in panel
        const suspended = panel?.suspended === true || panel?.suspended === 1;
        
        // Determine status based on panel data
        let status = server.status || 'unknown';
        if (suspended) {
          status = 'suspended';
        } else if (panel) {
          status = panel?.status || server.status || 'unknown';
        }
        
        // Transform the data to match frontend expectations
        return {
          _id: server._id,
          name: server.name,
          status: status,
          userId: server.owner, // Map owner to userId for frontend
          egg: server.eggId,    // Map eggId to egg for frontend
          location: server.locationId, // Map locationId to location for frontend
          limits: server.limits,
          createdAt: server.createdAt,
          clientUrl: identifier ? `${base}/server/${identifier}` : `${base}`,
          suspended: suspended
        };
      } catch (error) {
        if (shouldLogPanelErrors) {
                  }
        // Return server with fallback data and error flag
        return {
          _id: server._id,
          name: server.name,
          status: 'unreachable',
          userId: server.owner,
          egg: server.eggId,
          location: server.locationId,
          limits: server.limits,
          createdAt: server.createdAt,
          clientUrl: `${base}`,
          unreachable: true,
          error: error.message
        };
      }
    }));
    
    await setCache('api:admin:servers', enriched, 30);
    res.json(enriched);
  } catch (error) {
    console.error('Failed to fetch servers:', error);
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// GET /api/admin/servers/:id - get specific server
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const server = await Server.findById(String(req.params.id))
      .populate('owner', 'username email')
      .populate('eggId', 'name')
      .populate('locationId', 'name')
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
    try {
      if (server.panelServerId) {
        const panelResponse = await getServer(server.panelServerId);
        const panel = panelResponse?.attributes;
        const panelBuild = panel?.limits || panel?.build || {};
        const panelFeatures = panel?.feature_limits || {};
        
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
      suspended
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
    const { limits } = parsed.data;
    
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
    
    // Update server limits in panel
    try {
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
    
    // Update server in database
    server.limits = limits;
    await server.save();
    
    // Audit log
    // Audit log
    writeAudit(req, 'admin.servers:update', 'server', server._id.toString(), { 
      serverId: server._id.toString(), 
      serverName: server.name,
      newLimits: limits
    });
    
    // Invalidate caches
    await deleteCachePattern('api:admin:servers');
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

    const isForce = String(req.query.force).toLowerCase() === 'true';

    // Delete from Pterodactyl panel
    if (server.panelServerId) {
      try {
        const { deleteServer: deletePanelServer, forceDeleteServer } = require('../../services/pterodactyl');
        if (isForce) {
          await forceDeleteServer(server.panelServerId);
        } else {
          await deletePanelServer(server.panelServerId);
        }
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
    writeAudit(req, 'admin.servers:delete', 'server', server._id.toString(), {
      serverId: server._id.toString(),
      serverName: server.name,
      ownerId: server.owner?.toString(),
      panelServerId: server.panelServerId,
      forced: isForce,
    });

    // Invalidate caches
    await deleteCachePattern('api:admin:servers');
    await deleteCachePattern(`api:servers:${server.owner}:*`);
    await deleteCachePattern(`server:usage:${server.owner}`);
    await deleteCachePattern(`api:admin:server:${req.params.id}`);

    return res.json({ message: 'Server deleted successfully.' });
  } catch (error) {
    console.error('Admin server deletion error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred while deleting the server.' });
  }
});


module.exports = router;
