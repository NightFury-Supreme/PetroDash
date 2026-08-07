const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const Egg = require('../../models/Egg');

const router = express.Router();

const envSchema = z.object({ key: z.string().min(1), value: z.string().min(1) });
const createSchema = z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    icon: z.string().optional().or(z.literal('')), // Changed from iconUrl to icon
    pterodactylEggId: z.coerce.number().int().nonnegative(),
    pterodactylNestId: z.coerce.number().int().nonnegative(),
    recommended: z.coerce.boolean().optional().default(false),
    description: z.string().optional().default(''),
    env: z.array(envSchema).optional().default([]),
    allowedPlans: z.array(z.string()).optional().default([]),
});

router.get('/', requireAdmin, async (req, res) => {
    const { getCache, setCache } = require('../../lib/redis');
    const cached = await getCache('admin:eggs');
    if (cached) return res.json(cached);

    const list = await Egg.find().sort({ createdAt: -1 }).lean();
    await setCache('admin:eggs', list, 30);
    res.json(list);
});

router.post('/', requireAdmin, async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    const egg = await Egg.create({ ...parsed.data });
    
    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:eggs');

    res.status(201).json(egg);
});

router.get('/:id', requireAdmin, async (req, res) => {
    const { getCache, setCache } = require('../../lib/redis');
    const cacheKey = `admin:egg:${req.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const egg = await Egg.findById(String(req.params.id)).lean();
    if (!egg) return res.status(404).json({ error: 'Not found' });

    await setCache(cacheKey, egg, 30);
    res.json(egg);
});

router.put('/:id', requireAdmin, async (req, res) => {
    const parsed = createSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    const egg = await Egg.findByIdAndUpdate(String(req.params.id), parsed.data, { new: true }).lean();
    if (!egg) return res.status(404).json({ error: 'Not found' });

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:eggs');
    await deleteCachePattern(`admin:egg:${req.params.id}`);

    res.json(egg);
});

router.delete('/:id', requireAdmin, async (req, res) => {
    const egg = await Egg.findByIdAndDelete(String(req.params.id)).lean();
    if (!egg) return res.status(404).json({ error: 'Not found' });

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:eggs');
    await deleteCachePattern(`admin:egg:${req.params.id}`);

    res.json({ success: true });
});

module.exports = router;




