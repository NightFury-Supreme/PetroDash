const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const Location = require('../../models/Location');

const router = express.Router();

const schema = z.object({
    name: z.string().min(1),
    flag: z.string().min(1, 'Location flag is required'), // Changed from flagUrl to flag
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

router.get('/', requireAdmin, async (req, res) => {
    const { getCache, setCache } = require('../../lib/redis');
    const cached = await getCache('admin:locations');
    if (cached) return res.json(cached);

    const items = await Location.find().sort({ createdAt: -1 }).lean();

    const Plan = require('../../models/Plan');
    const allPlans = await Plan.find({}, '_id name').lean();
    const planMap = new Map();
    allPlans.forEach(p => {
        planMap.set(p._id.toString(), p.name);
        planMap.set(p.name, p.name);
    });

    const Server = require('../../models/Server');

    const mappedItems = await Promise.all(items.map(async loc => {
        const allowedPlanNames = (loc.allowedPlans || [])
            .map(ap => planMap.get(String(ap)))
            .filter(Boolean);
        const count = await Server.countDocuments({ locationId: loc._id });
        return {
            ...loc,
            serversCount: count,
            allowedPlanNames: [...new Set(allowedPlanNames)]
        };
    }));

    await setCache('admin:locations', mappedItems, 30);
    res.json(mappedItems);
});

router.post('/', requireAdmin, async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const created = await Location.create(parsed.data);

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:locations');

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

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:locations');

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

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:locations');

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.location.delete', 'location', deleted._id.toString(), { name: deleted.name });

    res.json({ success: true });
});

module.exports = router;




