const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const Location = require('../../models/Location');

const router = express.Router();

const schema = z.object({
    name: z.string().min(1),
    flag: z.string().min(1, 'Location flag is required'),
    latencyUrl: z.string().min(1, 'Node IP is required'),
    serverLimit: z.coerce.number().int().nonnegative().default(0),
    platform: z
        .object({
            platformLocationId: z.string().optional().default(''),
            swapMb: z.coerce.number().default(-1),
            blockIoWeight: z.coerce.number().default(500),
            cpuPinning: z.string().optional().default(''),
        })
        .optional()
        .default({}),
    allowedPlans: z.array(z.string()).optional().default([]),
});

// Helper to invalidate both caches
async function clearLocationCaches() {
    const { deleteCachePattern, deleteCache } = require('../../lib/redis');
    await deleteCachePattern('admin:locations');
    await deleteCache('api:locations');
}

router.get('/', requireAdmin, async (req, res) => {
    const { getCache, setCache } = require('../../lib/redis');
    const cached = await getCache('admin:locations');
    if (cached) return res.json(cached);

    const Plan = require('../../models/Plan');
    const allPlans = await Plan.find({}, '_id name').lean();
    const planMap = new Map();
    allPlans.forEach(p => {
        planMap.set(p._id.toString(), p.name);
        planMap.set(p.name, p.name);
    });

    // ISO 25010 Performance Optimization: Aggregation Pipeline to prevent N+1 Queries
    const mappedItems = await Location.aggregate([
        {
            $lookup: {
                from: 'servers',
                localField: '_id',
                foreignField: 'locationId',
                as: 'servers'
            }
        },
        {
            $addFields: {
                serversCount: { $size: "$servers" }
            }
        },
        {
            $project: {
                servers: 0 // Remove the joined array for performance
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    // Map plans manually since aggregation lookup for Array of Strings is tricky
    const finalItems = mappedItems.map(loc => {
        const allowedPlanNames = (loc.allowedPlans || [])
            .map(ap => planMap.get(String(ap)))
            .filter(Boolean);
        return {
            ...loc,
            allowedPlanNames: [...new Set(allowedPlanNames)]
        };
    });

    await setCache('admin:locations', finalItems, 30);
    res.json(finalItems);
});

router.post('/', requireAdmin, async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const created = await Location.create(parsed.data);

    await clearLocationCaches();

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.location.create', 'location', created._id.toString(), { created: parsed.data });

    res.status(201).json(created);
});

router.get('/:id', requireAdmin, async (req, res) => {
    const Server = require('../../models/Server');
    const loc = await Location.findById(String(req.params.id)).lean();
    if (!loc) return res.status(404).json({ error: 'Not found' });
    const serversCount = await Server.countDocuments({ locationId: req.params.id });
    res.json({ ...loc, serversCount });
});

router.put('/:id', requireAdmin, async (req, res) => {
    const parsed = schema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    
    const original = await Location.findById(String(req.params.id)).lean();
    if (!original) return res.status(404).json({ error: 'Not found' });

    const updated = await Location.findByIdAndUpdate(String(req.params.id), parsed.data, { new: true }).lean();

    await clearLocationCaches();

    const changes = {};
    for (const [k, v] of Object.entries(parsed.data)) {
        if (JSON.stringify(original[k]) !== JSON.stringify(v)) changes[k] = { old: original[k], new: v };
    }

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.location.update', 'location', updated._id.toString(), { changes });

    res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
    const Server = require('../../models/Server');
    const serversCount = await Server.countDocuments({ locationId: req.params.id });
    if (serversCount > 0) {
        return res.status(400).json({ error: 'Cannot delete location with existing servers' });
    }
    const deleted = await Location.findByIdAndDelete(String(req.params.id)).lean();
    if (!deleted) return res.status(404).json({ error: 'Not found' });

    await clearLocationCaches();

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.location.delete', 'location', deleted._id.toString(), { name: deleted.name });

    res.json({ success: true });
});

module.exports = router;
