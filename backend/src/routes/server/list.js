const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const Server = require('../../models/Server');
const { getServer } = require('../../services/pterodactyl');
const { getCache, setCache } = require('../../lib/redis');

const router = express.Router();

// GET /api/servers - list servers for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const paginate = String(req.query.paginate || '').toLowerCase() === 'true';
    let page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
    let pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize || '10')) || 10));

    const cacheKey = `api:servers:${req.user.sub}:${paginate}:${page}:${pageSize}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const baseQuery = { owner: req.user.sub };

    let listQuery = Server.find(baseQuery)
      .sort({ createdAt: -1 })
      .populate('eggId', 'name icon')
      .populate('locationId', 'name flag')
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
    const enriched = await Promise.all(list.map(async (s) => {
        let status = s.status || 'unknown';
        let suspended = status === 'suspended';
        
        let queuePosition = null;
        if (status === 'queued') {
          const aheadCount = await Server.countDocuments({
            status: 'queued',
            $or: [
              { priority: { $gt: s.priority || 0 } },
              { priority: s.priority || 0, createdAt: { $lt: s.createdAt } }
            ]
          });
          queuePosition = aheadCount + 1;
        }
        
        return {
          _id: s._id,
          name: s.name || 'Unnamed Server',
          status: status,
          queuePosition: queuePosition,
          limits: {
            diskMb: Number(s.limits?.diskMb || 0),
            memoryMb: Number(s.limits?.memoryMb || 0),
            cpuPercent: Number(s.limits?.cpuPercent || 0),
            backups: Number(s.limits?.backups || 0),
            databases: Number(s.limits?.databases || 0),
            allocations: Number(s.limits?.allocations || 0)
          },
          eggName: s.eggId?.name || 'Unknown',
          eggIcon: s.eggId?.icon || undefined,
          location: s.locationId?.name || 'Unknown',
          locationFlag: s.locationId?.flag || undefined,
          clientUrl: `${base}`,
          createdAt: s.createdAt || new Date(),
          suspended: suspended,
          unreachable: false
        };
    }));
    const filtered = enriched.filter(Boolean);
    if (deletedCount > 0) {
      const { deleteCachePattern, deleteCache } = require('../../lib/redis');
      await deleteCachePattern(`server:usage:${req.user.sub}`);
      await deleteCachePattern(`api:servers:${req.user.sub}:*`);
      await deleteCachePattern('api:admin:servers:*');
      await deleteCache('eggs:counts');
      
      if (paginate) {
        // Adjust total to reflect servers removed during enrichment
        page = Math.max(1, Math.min(page, Math.ceil(Math.max(total - deletedCount, 0) / pageSize) || 1));
      }
    }
    if (paginate) {
      const responseData = { data: filtered, meta: { total: Math.max(total - deletedCount, 0), page, pageSize } };
      await setCache(cacheKey, responseData, 30);
      return res.json(responseData);
    }
    await setCache(cacheKey, filtered, 30);
    return res.json(filtered);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return res.status(500).json({ error: 'Failed to list servers' });
  }
});

module.exports = router;



