const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const Server = require('../../models/Server');
const { getServer: getPanelServer } = require('../../services/pterodactyl');
const { hasServerLimitsChanged } = require('../../utils/security');

const router = express.Router();

// GET /api/servers/usage - aggregate usage from servers in our DB
router.get('/', requireAuth, async (req, res) => {
  try {
    const servers = await Server.find({ owner: req.user.sub }).lean();

    // Opportunistic sync with panel
    const synced = await Promise.all(
      servers.map(async (s) => {
        try {
          if (!s.panelServerId) return s;
          const panelResponse = await getPanelServer(s.panelServerId);
          const panel = panelResponse?.attributes;
          const panelBuild = panel?.limits || panel?.build || {};
          const panelFeatures = panel?.feature_limits || {};
          const updatedLimits = {
            diskMb: Number(panelBuild.disk) ?? s.limits?.diskMb,
            memoryMb: Number(panelBuild.memory) ?? s.limits?.memoryMb,
            cpuPercent: Number(panelBuild.cpu) ?? s.limits?.cpuPercent,
            backups: Number(panelFeatures.backups) ?? s.limits?.backups,
            databases: Number(panelFeatures.databases) ?? s.limits?.databases,
            allocations: Number(panelFeatures.allocations) ?? s.limits?.allocations,
          };
          const hasChange = hasServerLimitsChanged(s.limits, updatedLimits);
          if (hasChange) await Server.updateOne({ _id: s._id }, { $set: { limits: updatedLimits } });
          return { ...s, limits: updatedLimits };
        } catch (_) {
          return s; // ignore panel errors
        }
      })
    );

    const usage = synced.reduce(
      (acc, s) => {
        const l = s.limits || {};
        acc.diskMb += Number(l.diskMb) || 0;
        acc.memoryMb += Number(l.memoryMb) || 0;
        acc.cpuPercent += Number(l.cpuPercent) || 0;
        acc.backups += Number(l.backups) || 0;
        acc.databases += Number(l.databases) || 0;
        acc.allocations += Number(l.allocations) || 0;
        return acc;
      },
      { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 }
    );
    
    // Add servers count and ensure all fields are numbers
    const response = {
      diskMb: Number(usage.diskMb || 0),
      memoryMb: Number(usage.memoryMb || 0),
      cpuPercent: Number(usage.cpuPercent || 0),
      backups: Number(usage.backups || 0),
      databases: Number(usage.databases || 0),
      allocations: Number(usage.allocations || 0),
      servers: Number(servers.length || 0)
    };
    
    return res.json(response);
  } catch (e) {
    console.error('Usage aggregation failed:', e.message);
    return res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

module.exports = router;



