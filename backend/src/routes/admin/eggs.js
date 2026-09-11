const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const Egg = require('../../models/Egg');
require('../../models/EggCategory'); // Ensure model is registered before populate

const router = express.Router();

const envSchema = z.object({ key: z.string().min(1), value: z.string().min(1) });
const createSchema = z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    icon: z.string().min(1, 'Icon is required'),
    pterodactylEggId: z.coerce.number().int().nonnegative(),
    pterodactylNestId: z.coerce.number().int().nonnegative(),
    recommended: z.coerce.boolean().optional().default(false),
    description: z.string().min(1, 'Description is required').max(150, 'Description cannot exceed 150 characters'),
    env: z.array(envSchema).optional().default([]),
    allowedPlans: z.array(z.string()).optional().default([]),
});

router.get('/', requireAdmin, async (req, res) => {
    const { getCache, setCache } = require('../../lib/redis');
    const cached = await getCache('admin:eggs:with-count');
    if (cached) return res.json(cached);

    const Server = require('../../models/Server');
    const eggs = await Egg.find().populate('category').sort({ createdAt: -1 }).lean();
    
    const Plan = require('../../models/Plan');
    const allPlans = await Plan.find({}, '_id name').lean();
    const planMap = new Map();
    allPlans.forEach(p => {
        planMap.set(p._id.toString(), p.name);
        planMap.set(p.name, p.name);
    });

    const list = await Promise.all(eggs.map(async (egg) => {
        const count = await Server.countDocuments({ eggId: egg._id });
        const allowedPlanNames = (egg.allowedPlans || [])
            .map(ap => planMap.get(String(ap)))
            .filter(Boolean);

        return { 
            ...egg, 
            categoryName: egg.category?.name || 'Uncategorized',
            category: egg.category?._id?.toString() || egg.category,
            serversCount: count,
            allowedPlanNames: [...new Set(allowedPlanNames)]
        };
    }));

    await setCache('admin:eggs:with-count', list, 30);
    res.json(list);
});

router.post('/', requireAdmin, async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    const egg = await Egg.create({ ...parsed.data });
    
    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:eggs*');

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.egg.create', 'egg', egg._id.toString(), { created: parsed.data });

    res.status(201).json(egg);
});

router.get('/categories', requireAdmin, async (req, res) => {
    const { getCache, setCache } = require('../../lib/redis');
    const cached = await getCache('admin:eggs:categories');
    if (cached) return res.json(cached);

    const EggCategory = require('../../models/EggCategory');
    const mongoose = require('mongoose');
    
    // Auto-migrate string categories to ObjectIds
    const rawEggs = await mongoose.connection.db.collection('eggs').find({ category: { $type: 'string' } }).toArray();
    for (const raw of rawEggs) {
        if (raw.category) {
            const cat = await EggCategory.findOneAndUpdate(
                { name: raw.category }, 
                { $setOnInsert: { name: raw.category } }, 
                { upsert: true, new: true }
            );
            await mongoose.connection.db.collection('eggs').updateOne(
                { _id: raw._id }, 
                { $set: { category: cat._id } }
            );
        }
    }

    const categories = await EggCategory.find().sort({ name: 1 }).lean();
    
    // Calculate counts
    const counts = await Egg.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    const countMap = counts.reduce((acc, curr) => {
        if (curr._id) acc[curr._id.toString()] = curr.count;
        return acc;
    }, {});

    const result = categories.map(c => ({
        id: c._id.toString(),
        name: c.name,
        eggCount: countMap[c._id.toString()] || 0
    }));

    await setCache('admin:eggs:categories', result, 60);
    res.json(result);
});

router.post('/categories', requireAdmin, async (req, res) => {
    const EggCategory = require('../../models/EggCategory');
    const { name } = req.body;
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Name is required' });
    
    try {
        const cat = await EggCategory.create({ name: name.trim() });
        const { deleteCachePattern } = require('../../lib/redis');
        await deleteCachePattern('admin:eggs:categories');
        
        const { writeAudit } = require('../../middleware/audit');
        await writeAudit(req, 'admin.egg_category.create', 'egg_category', cat._id.toString(), { name: cat.name });
        
        res.json({ id: cat._id.toString(), name: cat.name, eggCount: 0 });
    } catch (e) {
        if (e.code === 11000) return res.status(400).json({ error: 'Category already exists' });
        res.status(500).json({ error: 'Internal error' });
    }
});

router.put('/categories/:id', requireAdmin, async (req, res) => {
    const EggCategory = require('../../models/EggCategory');
    const { name } = req.body;
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Name is required' });

    const cat = await EggCategory.findById(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Not found' });

    cat.name = name.trim();
    await cat.save();

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:eggs*');

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.egg_category.update', 'egg_category', cat._id.toString(), { name: cat.name });

    res.json({ id: cat._id.toString(), name: cat.name });
});

router.delete('/categories/:id', requireAdmin, async (req, res) => {
    const EggCategory = require('../../models/EggCategory');
    const cat = await EggCategory.findById(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Not found' });

    const count = await Egg.countDocuments({ category: cat._id });
    if (count > 0) return res.status(400).json({ error: 'Cannot delete category with eggs' });

    await cat.deleteOne();
    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:eggs:categories');

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.egg_category.delete', 'egg_category', cat._id.toString(), { name: cat.name });

    res.json({ success: true });
});

router.get('/:id', requireAdmin, async (req, res) => {
    const { getCache, setCache } = require('../../lib/redis');
    const cacheKey = `admin:egg:${req.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const egg = await Egg.findById(String(req.params.id)).populate('category').lean();
    if (!egg) return res.status(404).json({ error: 'Not found' });

    const Server = require('../../models/Server');
    const serversCount = await Server.countDocuments({ eggId: req.params.id });

    const formattedEgg = {
        ...egg,
        categoryName: egg.category?.name || 'Uncategorized',
        category: egg.category?._id?.toString() || egg.category,
        serversCount,
    };

    await setCache(cacheKey, formattedEgg, 30);
    res.json(formattedEgg);
});

router.put('/:id', requireAdmin, async (req, res) => {
    const parsed = createSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    
    const original = await Egg.findById(String(req.params.id)).lean();
    if (!original) return res.status(404).json({ error: 'Not found' });

    const egg = await Egg.findByIdAndUpdate(String(req.params.id), parsed.data, { new: true }).lean();

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:eggs*');
    await deleteCachePattern(`admin:egg:${req.params.id}`);

    const changes = {};
    for (const [k, v] of Object.entries(parsed.data)) {
        if (JSON.stringify(original[k]) !== JSON.stringify(v)) changes[k] = { old: original[k], new: v };
    }

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.egg.update', 'egg', egg._id.toString(), { changes });

    res.json(egg);
});

router.delete('/:id', requireAdmin, async (req, res) => {
    const Server = require('../../models/Server');
    const serversCount = await Server.countDocuments({ eggId: req.params.id });
    if (serversCount > 0) {
        return res.status(400).json({ error: 'Cannot delete egg with existing servers' });
    }

    const egg = await Egg.findByIdAndDelete(String(req.params.id)).lean();
    if (!egg) return res.status(404).json({ error: 'Not found' });

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:eggs*');
    await deleteCachePattern(`admin:egg:${req.params.id}`);

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.egg.delete', 'egg', egg._id.toString(), { name: egg.name });

    res.json({ success: true });
});

module.exports = router;
