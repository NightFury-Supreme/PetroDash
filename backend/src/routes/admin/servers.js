const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const Server = require('../../models/Server');
const { audit } = require('../../middleware/audit');
const { z } = require('zod');
const { updateServerBuild } = require('../../services/pterodactyl');

const router = express.Router();

// GET /api/admin/servers - list all servers
router.get('/', requireAdmin, async (req, res) => {
  try {
    const servers = await Server.find({})
      .populate('owner', 'username email')
      .populate('eggId', 'name')
      .populate('locationId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    
    // Transform the data to match frontend expectations
    const transformedServers = servers.map(server => ({
      _id: server._id,
      name: server.name,
      status: server.status,
      userId: server.owner, // Map owner to userId for frontend
      egg: server.eggId,    // Map eggId to egg for frontend
      location: server.locationId, // Map locationId to location for frontend
      limits: server.limits,
      createdAt: server.createdAt
    }));
    
    res.json(transformedServers);
  } catch (error) {
    console.error('Failed to fetch servers:', error);
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// GET /api/admin/servers/:id - get specific server
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const server = await Server.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('eggId', 'name')
      .populate('locationId', 'name')
      .lean();
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
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
      createdAt: server.createdAt
    };
    
    res.json(transformedServer);
  } catch (error) {
    console.error('Failed to fetch server:', error);
    res.status(500).json({ error: 'Failed to fetch server' });
  }
});

// PATCH /api/admin/servers/:id - update server
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
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
    
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
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
      await updateServerBuild(server.pterodactylId, {
        memory: limits.memoryMb,
        swap: 0,
        disk: limits.diskMb,
        io: 500,
        cpu: limits.cpuPercent,
        threads: null,
        oom_disabled: false
      });
    } catch (panelError) {
      console.error('Panel update failed:', panelError);
      return res.status(502).json({ 
        error: 'Panel update failed', 
        details: panelError.message 
      });
    }
    
    // Update server in database
    server.limits = limits;
    await server.save();
    
    // Audit log
    audit(req, 'admin.servers:update', { 
      serverId: server._id, 
      serverName: server.name,
      newLimits: limits
    });
    
    res.json(server);
  } catch (error) {
    console.error('Server update error:', error);
    res.status(500).json({ error: 'Failed to update server' });
  }
});

// DELETE /api/admin/servers/:id - delete server
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check if server is suspended
    if (server.status.toLowerCase() === 'suspended') {
      return res.status(403).json({ 
        error: 'Cannot delete suspended server', 
        details: 'Server is suspended. Contact staff for assistance.',
        serverId: server._id
      });
    }
    
    // Delete server from panel
    try {
      const { deleteServer: deletePanelServer } = require('../../services/pterodactyl');
      await deletePanelServer(server.pterodactylId);
    } catch (panelError) {
      console.error('Panel deletion failed:', panelError);
      // Continue with database deletion even if panel fails
    }
    
    // Delete server from database
    await Server.findByIdAndDelete(req.params.id);
    
    // Audit log
    audit(req, 'admin.servers:delete', { 
      serverId: req.params.id, 
      serverName: server.name,
      userId: server.userId
    });
    
    res.json({ message: 'Server deleted successfully' });
  } catch (error) {
    console.error('Server deletion error:', error);
    res.status(500).json({ error: 'Failed to delete server' });
  }
});

module.exports = router;
