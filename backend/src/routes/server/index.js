const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../../middleware/auth');
const Server = require('../../models/Server');
const { getServer: getPanelServer } = require('../../services/pterodactyl');
const { hasServerLimitsChanged } = require('../../utils/security');

const router = express.Router();
const { validateObjectId } = require('../../middleware/validateObjectId');

// Import route handlers
const listRouter = require('./list');
const createRouter = require('./create');
const usageRouter = require('./usage');

// Mount base routes
router.use('/', listRouter);           // GET /api/servers
router.use('/', createRouter);         // POST /api/servers
router.use('/usage', usageRouter);     // GET /api/servers/usage

// Handle ID-specific routes directly in this file to avoid conflicts
router.get('/:id', requireAuth, validateObjectId('id'), async (req, res) => {
  try {
    const server = await Server.findOne({ _id: req.params.id, owner: req.user.sub }).lean();
    if (!server) return res.status(404).json({ error: 'Server not found' });

    let unreachable = false;
    let suspended = Boolean(server.status && server.status.toLowerCase() === 'suspended');
    let errorMessage = null;

    // Try syncing from panel if available; capture failures so we can surface unreachable state
    try {
      if (server.panelServerId) {
        const panelResponse = await getPanelServer(server.panelServerId);
        const panel = panelResponse?.attributes;
        const panelBuild = panel?.limits || panel?.build || {};
        const panelFeatures = panel?.feature_limits || {};

        suspended = suspended || panel?.suspended === true || panel?.suspended === 1;
        if (panel?.status && !suspended) {
          server.status = panel.status;
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
      }
    } catch (panelError) {
      unreachable = true;
      const detail = panelError?.response?.data?.errors?.[0]?.detail;
      errorMessage = detail || panelError?.message || 'Pterodactyl request failed';
      if (!suspended) {
        server.status = 'unreachable';
      }
    }

    const responsePayload = {
      ...server,
      status: server.status,
      unreachable,
      suspended,
      error: errorMessage || undefined,
    };

    res.set('Cache-Control', 'no-store');
    return res.json(responsePayload);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load server' });
  }
});

// PATCH /api/servers/:id - update server
const { createRateLimiter } = require('../../middleware/rateLimit');
// Validation schema for update payload
const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  limits: z.object({
    diskMb: z.coerce.number().int().min(100).optional(),
    memoryMb: z.coerce.number().int().min(128).optional(),
    cpuPercent: z.coerce.number().int().min(10).optional(),
    backups: z.coerce.number().int().min(0).optional(),
    databases: z.coerce.number().int().min(0).optional(),
    allocations: z.coerce.number().int().min(1).optional(),
  }).partial().optional()
});

router.patch('/:id', requireAuth, validateObjectId('id'), createRateLimiter(20, 60 * 1000), async (req, res) => {
  let lockAcquired = false;
  const userId = req.user.sub;
  const User = require('../../models/User');
  
  try {
    const startTime = Date.now();
    const serverId = req.params.id;

    // Validate server ID format
    if (!serverId || !/^[0-9a-fA-F]{24}$/.test(serverId)) {
      return res.status(400).json({ 
        error: 'Invalid server ID format',
        details: 'Server ID must be a valid MongoDB ObjectId'
      });
    }

    // Acquire atomic TOCTOU lock with 30-second timeout
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
      return res.status(429).json({ error: 'Another server operation is currently in progress. Please wait a moment.' });
    }
    lockAcquired = true;

    // Find server and verify ownership
    const server = await Server.findOne({ _id: serverId, owner: userId });
    if (!server) {
      return res.status(404).json({ 
        error: 'Server not found',
        details: 'The specified server does not exist or you do not have permission to access it'
      });
    }

    // Check suspended state against local and panel data
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
      // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (_) {
        // Ignore panel lookup failures here; unreachable handling occurs later when attempting updates.
      }
    }

    // Check server status
    const serverStatus = server.status?.toLowerCase();
    const locallySuspended = serverStatus === 'suspended' || server.suspended === true;
    if (locallySuspended || panelSuspended) {
      return res.status(403).json({ 
        error: 'Cannot update suspended server', 
        details: 'Server is suspended. Contact staff for assistance.',
        serverId: server._id,
        serverStatus: server.status
      });
    }

    if (serverStatus === 'installing' || serverStatus === 'transferring') {
      return res.status(409).json({ 
        error: 'Server is busy', 
        details: `Cannot update server while it is ${serverStatus}. Please wait for the operation to complete.`,
        serverId: server._id,
        serverStatus: server.status
      });
    }



    // Validate incoming body
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    const { name, limits } = parsed.data;
    const changes = {};

    // Update server name if provided
    if (name && typeof name === 'string' && name.trim()) {
      const newName = name.trim();
      if (newName !== server.name) {
        // Update server name on Pterodactyl panel if panelServerId exists
        if (server.panelServerId) {
          try {
            const { updateServerDetails } = require('../../services/pterodactyl');
            
            await updateServerDetails(server.panelServerId, { 
              name: newName, 
              user: user.pterodactylUserId, 
              external_id: user._id.toString() 
            });
            
          } catch (panelError) {
            return res.status(400).json({ 
              error: 'Panel rename failed', 
              details: panelError?.response?.data?.errors?.[0]?.detail || panelError.message,
              panelError: process.env.NODE_ENV === 'development' ? panelError.message : undefined,
              panelResponse: process.env.NODE_ENV === 'development' ? panelError?.response?.data : undefined
            });
          }
        }
        
        server.name = newName;
        changes.name = newName;
      }
    }

    // Validate and update limits if provided
    if (limits && typeof limits === 'object') {
      const userLimits = user.resources;
      
      // Get current usage across all servers except this one
      const otherServers = await Server.find({ 
        owner: user._id, 
        _id: { $ne: server._id } 
      }).lean();

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

      // Enforce server-side minimums (mirror /create)
      const min = { diskMb: 100, memoryMb: 128, cpuPercent: 10, backups: 0, databases: 0, allocations: 1 };
      if (newLimits.diskMb < min.diskMb) violations.diskMb = `Minimum disk is ${min.diskMb} MB`;
      if (newLimits.memoryMb < min.memoryMb) violations.memoryMb = `Minimum memory is ${min.memoryMb} MB`;
      if (newLimits.cpuPercent < min.cpuPercent) violations.cpuPercent = `Minimum CPU is ${min.cpuPercent}%`;
      if (newLimits.backups < min.backups) violations.backups = `Minimum backups is ${min.backups}`;
      if (newLimits.databases < min.databases) violations.databases = `Minimum databases is ${min.databases}`;
      if (newLimits.allocations < min.allocations) violations.allocations = `Minimum allocations is ${min.allocations}`;

      // Check each limit against remaining resources
      if (newLimits.diskMb > remaining.diskMb) {
        violations.diskMb = `Exceeds remaining disk (${remaining.diskMb.toLocaleString()} MB available)`;
      }
      if (newLimits.memoryMb > remaining.memoryMb) {
        violations.memoryMb = `Exceeds remaining memory (${remaining.memoryMb.toLocaleString()} MB available)`;
      }
      if (newLimits.cpuPercent > remaining.cpuPercent) {
        violations.cpuPercent = `Exceeds remaining CPU (${remaining.cpuPercent}% available)`;
      }
      if (newLimits.backups > remaining.backups) {
        violations.backups = `Exceeds remaining backups (${remaining.backups} available)`;
      }
      if (newLimits.databases > remaining.databases) {
        violations.databases = `Exceeds remaining databases (${remaining.databases} available)`;
      }
      if (newLimits.allocations > remaining.allocations) {
        violations.allocations = `Exceeds remaining allocations (${remaining.allocations} available)`;
      }

      if (Object.keys(violations).length > 0) {
        return res.status(400).json({ 
          error: 'Requested resources exceed your limits', 
          violations, 
          remaining, 
          limits: userLimits 
        });
      }

      // Update server limits
      server.limits = newLimits;
      changes.limits = newLimits;
      
      // Update server on Pterodactyl panel if panelServerId exists
      if (server.panelServerId) {
        try {
          const { updateServerBuild, updateServerDetails } = require('../../services/pterodactyl');
          
          // Get current server details to get the allocation ID
          if (!panelServerResponse) {
            panelServerResponse = await getPanelServer(server.panelServerId);
          }

          const panelServer = panelServerResponse?.attributes;
          const allocations = panelServerResponse?.relationships?.allocations?.data;
          
          // Try to get allocation ID from different possible locations
          let allocationId = null;
          
          if (allocations && allocations.length > 0) {
            allocationId = allocations[0]?.attributes?.id || allocations[0]?.id;
          } else if (panelServer?.allocation) {
            allocationId = panelServer.allocation;
          }
          
          if (!allocationId) {
            throw new Error('Could not find allocation ID for server. Server may not have any allocations.');
          }
          

          
          // Update server build (limits)
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
          return res.status(400).json({ 
            error: 'Panel update failed', 
            details: panelError?.response?.data?.errors?.[0]?.detail || panelError.message,
            panelError: process.env.NODE_ENV === 'development' ? panelError.message : undefined,
            panelResponse: process.env.NODE_ENV === 'development' ? panelError?.response?.data : undefined
          });
        }
      }
    }

    // Save changes to database
    server.updatedAt = new Date();
    await server.save();

    // Log audit trail
    const { writeAudit } = require('../../middleware/audit');
    writeAudit(req, 'server.update', 'server', server._id.toString(), { 
      changed: changes,
      serverId: server._id,
      serverName: server.name,
      userId: user._id
    });

     
//     const responseTime = Date.now() - startTime;
    return res.json({ 
      server,
      message: 'Server updated successfully',
      changes: Object.keys(changes).length > 0 ? changes : undefined
    });

  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error',
      details: 'An unexpected error occurred while updating the server',
      requestId: req.id || 'unknown'
    });
  } finally {
    if (lockAcquired) {
      await User.updateOne({ _id: userId }, { $set: { serverLock: null } });
    }
  }
});

// DELETE /api/servers/:id - delete server
router.delete('/:id', requireAuth, validateObjectId('id'), createRateLimiter(10, 60 * 1000), async (req, res) => {
  let lockAcquired = false;
  const userId = req.user.sub;
  const User = require('../../models/User');

  try {
    // 1. Verify the server exists and belongs to this user
    const server = await Server.findOne({ _id: req.params.id, owner: userId });
    if (!server) return res.status(404).json({ error: 'Server not found' });
    
    const isForce = String(req.query.force).toLowerCase() === 'true';

    // 2. If NOT a force-delete, block deletion of suspended servers
    if (!isForce && server.status && server.status.toLowerCase() === 'suspended') {
      return res.status(403).json({ 
        error: 'Cannot delete suspended server', 
        details: 'Server is suspended. Contact staff for assistance, or use force removal.',
        serverId: server._id
      });
    }

    // 3. Acquire per-user atomic lock to prevent concurrent operations
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
      return res.status(429).json({ error: 'Another server operation is in progress. Please wait a moment.' });
    }
    lockAcquired = true;

    // 4. Delete from Pterodactyl panel
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

        // 404 = server already gone; safe to remove locally
        if (status === 404) {
          console.warn(`Panel server ${server.panelServerId} already gone — cleaning up locally.`);
        } else {
          // For any other panel error, return 502 and do NOT delete locally
          return res.status(400).json({
            error: 'Panel deletion failed. The server record has NOT been removed.',
            details: detail,
          });
        }
      }
    }

    // 5. Remove server record from database
    await Server.deleteOne({ _id: server._id });

    // 6. Audit trail
    const { writeAudit } = require('../../middleware/audit');
    writeAudit(req, 'server.delete', 'server', server._id.toString(), {
      panelServerId: server.panelServerId,
      forced: isForce,
    });

    // Email notification for server deletion (non-blocking)
    try {
      if (user?.email) {
        const { sendMailTemplate } = require('../../lib/mail');
        await sendMailTemplate({
          to: user.email,
          templateKey: 'serverDeleted',
          data: { serverName: server.name }
        });
      }
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_) {}

    return res.json({ ok: true, message: 'Server deleted successfully.' });
  } catch (error) {
    console.error('Delete server error:', error);
    return res.status(500).json({ error: 'Failed to delete server' });
  } finally {
    if (lockAcquired) {
      await User.updateOne({ _id: userId }, { $set: { serverLock: null } });
    }
  }
});

module.exports = router;



