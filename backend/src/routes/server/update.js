const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const User = require('../../models/User');
const Server = require('../../models/Server');
const { getServer: getPanelServer, getServer, updateServerBuild, updateServerDetails } = require('../../services/pterodactyl');

const router = express.Router();

// Enhanced validation schema with better constraints
const updateSchema = z.object({
  name: z.string()
    .min(1, 'Server name is required')
    .max(50, 'Server name must be 50 characters or less')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Server name can only contain letters, numbers, spaces, hyphens, and underscores')
    .optional(),
  limits: z.object({
    diskMb: z.coerce.number()
      .int('Disk must be a whole number')
      .min(100, 'Disk must be at least 100 MB')
      .max(1000000, 'Disk cannot exceed 1,000,000 MB')
      .optional(),
    memoryMb: z.coerce.number()
      .int('Memory must be a whole number')
      .min(128, 'Memory must be at least 128 MB')
      .max(1000000, 'Memory cannot exceed 1,000,000 MB')
      .optional(),
    cpuPercent: z.coerce.number()
      .int('CPU must be a whole number')
      .min(10, 'CPU must be at least 10%')
      .max(1000, 'CPU cannot exceed 1000%')
      .optional(),
    backups: z.coerce.number()
      .int('Backups must be a whole number')
      .min(0, 'Backups cannot be negative')
      .max(1000, 'Backups cannot exceed 1000')
      .optional(),
    databases: z.coerce.number()
      .int('Databases must be a whole number')
      .min(0, 'Databases cannot be negative')
      .max(1000, 'Databases cannot exceed 1000')
      .optional(),
    allocations: z.coerce.number()
      .int('Allocations must be a whole number')
      .min(1, 'Allocations must be at least 1')
      .max(100, 'Allocations cannot exceed 100')
      .optional(),
  }).optional(),
});

// PATCH /api/servers/:id
router.patch('/', requireAuth, createRateLimiter(10, 60 * 1000), async (req, res) => {
  try {
    const startTime = Date.now();
    const userId = req.user.sub;
    const serverId = req.params.id;

    // Validate server ID format
    if (!serverId || !/^[0-9a-fA-F]{24}$/.test(serverId)) {
      return res.status(400).json({ 
        error: 'Invalid server ID format',
        details: 'Server ID must be a valid MongoDB ObjectId'
      });
    }

    // Validate request body
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: parsed.error.flatten(),
        fieldErrors: parsed.error.flatten().fieldErrors
      });
    }

    // Find server and verify ownership
    const server = await Server.findOne({ _id: serverId, owner: userId });
    if (!server) {
      return res.status(404).json({ 
        error: 'Server not found',
        details: 'The specified server does not exist or you do not have permission to access it'
      });
    }

    // Check if server is unreachable or suspended
    let unreachable = false;
    let suspended = false;
    try {
      if (server.panelServerId) {
        const panelResponse = await getServer(server.panelServerId);
        const panel = panelResponse?.attributes;
        suspended = panel?.suspended === true || panel?.suspended === 1;
      }
    } catch (panelError) {
      unreachable = true;
    }

    if (unreachable) {
      return res.status(400).json({ 
        error: 'Cannot edit unreachable server',
        details: 'This server is currently unreachable and cannot be edited. Please contact support if this issue persists.',
        serverId: serverId
      });
    }

    if (suspended) {
      return res.status(400).json({ 
        error: 'Cannot edit suspended server',
        details: 'This server is suspended in the panel and cannot be edited. Please contact admin for assistance.',
        serverId: serverId
      });
    }

    // Check server status
    const serverStatus = server.status?.toLowerCase();
    if (serverStatus === 'suspended') {
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

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        details: 'User account could not be located'
      });
    }

    const desired = parsed.data;
    const changes = {};

    // Validate updated limits against user quotas
    if (desired.limits) {
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

      const newLimits = { ...server.limits, ...desired.limits };
      const violations = {};

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
          limits: userLimits,
          details: 'One or more resource limits exceed your available quota'
        });
      }

      // Update on Pterodactyl panel first
      try {
        
        // Fetch current build to preserve required allocation id
        const panel = await getPanelServer(server.panelServerId);
        if (!panel) {
          throw new Error('Server not found on panel');
        }

        const currentAllocationId = panel?.allocation || panel?.relationships?.allocation?.attributes?.id || 0;
        
        await updateServerBuild(server.panelServerId, {
          allocation: currentAllocationId,
          memory: newLimits.memoryMb,
          swap: 0,
          disk: newLimits.diskMb,
          io: 500,
          cpu: newLimits.cpuPercent,
          databases: newLimits.databases,
          allocations: newLimits.allocations,
          backups: newLimits.backups,
        });

        server.limits = newLimits;
        changes.limits = newLimits;
      } catch (panelError) {
        return res.status(502).json({ 
          error: 'Panel update failed', 
          details: panelError?.response?.data?.errors?.[0]?.detail || panelError.message,
          panelError: process.env.NODE_ENV === 'development' ? panelError.message : undefined
        });
      }
    }

    // Update server name if provided
    if (typeof desired.name === 'string' && desired.name.trim()) {
      const newName = desired.name.trim();
      
      // Check if name actually changed
      if (newName !== server.name) {
        try {
          
          await updateServerDetails(server.panelServerId, { 
            name: newName, 
            user: user.pterodactylUserId, 
            external_id: user._id.toString() 
          });

          server.name = newName;
          changes.name = newName;
        } catch (panelError) {
          return res.status(502).json({ 
            error: 'Panel rename failed', 
            details: panelError?.response?.data?.errors?.[0]?.detail || panelError.message,
            panelError: process.env.NODE_ENV === 'development' ? panelError.message : undefined
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

    const responseTime = Date.now() - startTime;
    return res.json({ 
      server,
      message: 'Server updated successfully',
      changes: Object.keys(changes).length > 0 ? changes : undefined
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error',
      details: 'An unexpected error occurred while updating the server',
      requestId: req.id || 'unknown'
    });
  }
});

module.exports = router;


