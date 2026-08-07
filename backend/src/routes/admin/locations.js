const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const Location = require('../../models/Location');

const router = express.Router();

const schema = z.object({
    name: z.string().min(1),
    flag: z.string().optional().or(z.literal('')), // Changed from flagUrl to flag
    latencyUrl: z.string().optional().or(z.literal('')),
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
    await setCache('admin:locations', items, 30);
    res.json(items);
});

router.post('/', requireAdmin, async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const created = await Location.create(parsed.data);

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:locations');

    res.status(201).json(created);
});

router.get('/:id', requireAdmin, async (req, res) => {
    const loc = await Location.findById(String(req.params.id)).lean();
    if (!loc) return res.status(404).json({ error: 'Not found' });
    res.json(loc);
});

router.put('/:id', requireAdmin, async (req, res) => {
    const parsed = schema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const updated = await Location.findByIdAndUpdate(String(req.params.id), parsed.data, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Not found' });

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:locations');

    res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
    const deleted = await Location.findByIdAndDelete(String(req.params.id)).lean();
    if (!deleted) return res.status(404).json({ error: 'Not found' });

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:locations');

    res.json({ success: true });
});

module.exports = router;




