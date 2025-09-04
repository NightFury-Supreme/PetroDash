const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const Egg = require('../../models/Egg');

const router = express.Router();

const envSchema = z.object({ key: z.string().min(1), value: z.string().min(1) });
const createSchema = z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    iconUrl: z.string().url().optional().or(z.literal('')),
    pterodactylEggId: z.coerce.number().int().nonnegative(),
    pterodactylNestId: z.coerce.number().int().nonnegative(),
    recommended: z.coerce.boolean().optional().default(false),
    description: z.string().optional().default(''),
    env: z.array(envSchema).optional().default([]),
    allowedPlans: z.array(z.string()).optional().default([]),
});

router.get('/', requireAdmin, async (req, res) => {
    const list = await Egg.find().sort({ createdAt: -1 }).lean();
    res.json(list);
});

router.post('/', requireAdmin, async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    const egg = await Egg.create({ ...parsed.data });
    res.status(201).json(egg);
});

router.get('/:id', requireAdmin, async (req, res) => {
    const egg = await Egg.findById(req.params.id).lean();
    if (!egg) return res.status(404).json({ error: 'Not found' });
    res.json(egg);
});

router.put('/:id', requireAdmin, async (req, res) => {
    const parsed = createSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    const egg = await Egg.findByIdAndUpdate(req.params.id, parsed.data, { new: true }).lean();
    if (!egg) return res.status(404).json({ error: 'Not found' });
    res.json(egg);
});

router.delete('/:id', requireAdmin, async (req, res) => {
    const egg = await Egg.findByIdAndDelete(req.params.id).lean();
    if (!egg) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
});

module.exports = router;




