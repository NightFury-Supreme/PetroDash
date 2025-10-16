const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const Server = require('../../models/Server');
const { getServer } = require('../../services/pterodactyl');

const router = express.Router();

// GET /api/servers - list servers for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const paginate = String(req.query.paginate || '').toLowerCase() === 'true';
    let page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
    let pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize || '10')) || 10));

    const baseQuery = { owner: req.user.sub };

    let listQuery = Server.find(baseQuery)
      .sort({ createdAt: -1 })
      .populate('eggId', 'name icon')
      .populate('locationId', 'name')
      .lean();

    if (paginate) {
      listQuery = listQuery.skip((page - 1) * pageSize).limit(pageSize);
    }

    const [list, total] = await Promise.all([
      listQuery,
      paginate ? Server.countDocuments(baseQuery) : Promise.resolve(0)
    ]);
    
    if (!list || list.length === 0) {
      return res.json([]);
    }
    
  const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
  let deletedCount = 0;
  const { writeAudit } = require('../../middleware/audit');
    const enriched = await Promise.all((list || []).map(async (s) => {
      try {
        const panelResponse = s.panelServerId ? await getServer(s.panelServerId) : null;
        const panel = panelResponse?.attributes;
        const identifier = panel?.identifier || panel?.uuid || null;
        
        // Check if server is suspended in panel
        const suspended = panel?.suspended === true || panel?.suspended === 1;
        
        // Determine status based on panel data
        let status = s.status || 'unknown';
        if (suspended) {
          status = 'suspended';
        } else if (panel) {
          status = panel?.status || s.status || 'unknown';
        }
        
        // Ensure consistent data structure
        return {
          _id: s._id,
          name: s.name || 'Unnamed Server',
          status: status,
          limits: {
            diskMb: Number(s.limits?.diskMb || 0),
            memoryMb: Number(s.limits?.memoryMb || 0),
            cpuPercent: Number(s.limits?.cpuPercent || 0),
            backups: Number(s.limits?.backups || 0),
            databases: Number(s.limits?.databases || 0),
            allocations: Number(s.limits?.allocations || 0)
          },
          eggId: s.eggId || { name: 'Unknown', icon: null },
          locationId: s.locationId || { name: 'Unknown' },
          clientUrl: identifier ? `${base}/server/${identifier}` : `${base}`,
          createdAt: s.createdAt || new Date(),
          suspended: suspended
        };
      } catch (error) {
        const panelStatus = error?.response?.status;
        const panelDetail = error?.response?.data?.errors?.[0]?.detail || '';
        const notFound = panelStatus === 404 || panelDetail.includes('assigned pterodactyl server was not found');
        if (notFound) {
          deletedCount += 1;
          await Server.deleteOne({ _id: s._id });
          writeAudit(req, 'server.delete', 'server', s._id.toString(), {
            reason: 'panel_not_found',
            panelServerId: s.panelServerId,
            panelStatus,
            panelDetail
          });
          return null;
        }
        // Return server with fallback data and error flag
        return {
          _id: s._id,
          name: s.name || 'Unnamed Server',
          status: 'unreachable',
          limits: {
            diskMb: Number(s.limits?.diskMb || 0),
            memoryMb: Number(s.limits?.memoryMb || 0),
            cpuPercent: Number(s.limits?.cpuPercent || 0),
            backups: Number(s.limits?.backups || 0),
            databases: Number(s.limits?.databases || 0),
            allocations: Number(s.limits?.allocations || 0)
          },
          eggId: s.eggId || { name: 'Unknown', icon: null },
          locationId: s.locationId || { name: 'Unknown' },
          clientUrl: `${base}`,
          createdAt: s.createdAt || new Date(),
          unreachable: true,
          error: error.message
        };
      }
    }));
    const filtered = enriched.filter(Boolean);
    if (deletedCount > 0 && paginate) {
      // Adjust total to reflect servers removed during enrichment
      page = Math.max(1, Math.min(page, Math.ceil(Math.max(total - deletedCount, 0) / pageSize) || 1));
    }
    
    if (paginate) {
      return res.json({ data: filtered, meta: { total: Math.max(total - deletedCount, 0), page, pageSize } });
    }
    return res.json(filtered);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to list servers' });
  }
});

module.exports = router;



