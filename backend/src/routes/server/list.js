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
      .populate('eggId', 'name iconUrl')
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
    const enriched = await Promise.all((list || []).map(async (s) => {
      try {
        const panelResponse = s.panelServerId ? await getServer(s.panelServerId) : null;
        const panel = panelResponse?.attributes;
        const identifier = panel?.identifier || panel?.uuid || null;
        
        // Ensure consistent data structure
        return {
          _id: s._id,
          name: s.name || 'Unnamed Server',
          status: s.status || 'unknown',
          limits: {
            diskMb: Number(s.limits?.diskMb || 0),
            memoryMb: Number(s.limits?.memoryMb || 0),
            cpuPercent: Number(s.limits?.cpuPercent || 0),
            backups: Number(s.limits?.backups || 0),
            databases: Number(s.limits?.databases || 0),
            allocations: Number(s.limits?.allocations || 0)
          },
          eggId: s.eggId || { name: 'Unknown', iconUrl: null },
          locationId: s.locationId || { name: 'Unknown' },
          clientUrl: identifier ? `${base}/server/${identifier}` : `${base}`,
          createdAt: s.createdAt || new Date()
        };
      } catch (error) {
        console.error(`Failed to enrich server ${s._id}:`, error.message);
        // Return server with fallback data
        return {
          _id: s._id,
          name: s.name || 'Unnamed Server',
          status: s.status || 'unknown',
          limits: {
            diskMb: Number(s.limits?.diskMb || 0),
            memoryMb: Number(s.limits?.memoryMb || 0),
            cpuPercent: Number(s.limits?.cpuPercent || 0),
            backups: Number(s.limits?.backups || 0),
            databases: Number(s.limits?.databases || 0),
            allocations: Number(s.limits?.allocations || 0)
          },
          eggId: s.eggId || { name: 'Unknown', iconUrl: null },
          locationId: s.locationId || { name: 'Unknown' },
          clientUrl: `${base}`,
          createdAt: s.createdAt || new Date()
        };
      }
    }));
    
    if (paginate) {
      return res.json({ data: enriched, meta: { total, page, pageSize } });
    }
    return res.json(enriched);
  } catch (e) {
    console.error('List servers failed:', e.message);
    return res.status(500).json({ error: 'Failed to list servers' });
  }
});

module.exports = router;



