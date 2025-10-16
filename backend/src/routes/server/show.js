const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const Server = require('../../models/Server');
const { getServer: getPanelServer } = require('../../services/pterodactyl');
const { hasServerLimitsChanged } = require('../../utils/security');

const router = express.Router();
const shouldLogPanelErrors = process.env.NODE_ENV === 'development';

    // GET /api/servers/:id
    router.get('/', requireAuth, createRateLimiter(60, 60 * 1000), async (req, res) => {
      try {
        const server = await Server.findOne({ _id: req.params.id, owner: req.user.sub }).lean();
    if (!server) return res.status(404).json({ error: 'Server not found' });

    // Try syncing from panel if available; ignore errors to keep endpoint responsive
    let unreachable = false;
    let error = null;
    let suspended = false;
    try {
      if (server.panelServerId) {
        const panelResponse = await getPanelServer(server.panelServerId);
        const panel = panelResponse?.attributes;
        const panelBuild = panel?.limits || panel?.build || {};
        const panelFeatures = panel?.feature_limits || {};
        
        // Check if server is suspended in panel or local database
        suspended = panel?.suspended === true || panel?.suspended === 1 || panel?.status === 'suspended' || server.status === 'suspended';
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
      // Set status to unreachable when panel call fails
      server.status = 'unreachable';
    }

    const response = {
      ...server,
      unreachable,
      error: error || undefined,
      suspended
    };
    return res.json(response);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load server' });
  }
});

module.exports = router;


