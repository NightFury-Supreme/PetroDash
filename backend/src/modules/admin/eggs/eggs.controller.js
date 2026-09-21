const { z } = require('zod');
const { writeAudit } = require('../../../middleware/audit');
const eggsService = require('./eggs.service');
const AppError = require('../../../utils/AppError');

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

exports.getEggsList = async (req, res, next) => {
    try {
        const list = await eggsService.getEggsList();
        res.json(list);
    } catch (error) {
        next(error);
    }
};

exports.createEgg = async (req, res, next) => {
    try {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError('Invalid payload', 400, 'ERR_BAD_REQUEST', parsed.error.flatten());
        }
        const egg = await eggsService.createEgg(parsed.data);
        await writeAudit(req, 'admin.egg.create', 'egg', egg._id.toString(), { created: parsed.data });
        res.status(201).json(egg);
    } catch (error) {
        next(error);
    }
};

exports.getEggCategories = async (req, res, next) => {
    try {
        const categories = await eggsService.getEggCategories();
        res.json(categories);
    } catch (error) {
        next(error);
    }
};

exports.createEggCategory = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string') {
            throw new AppError('Name is required', 400, 'ERR_BAD_REQUEST');
        }
        
        const result = await eggsService.createEggCategory(name);
        await writeAudit(req, 'admin.egg_category.create', 'egg_category', result.catObj._id.toString(), { created: { name: result.catObj.name } });
        
        res.json({ id: result.id, name: result.name, eggCount: result.eggCount });
    } catch (error) {
        next(error);
    }
};

exports.updateEggCategory = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string') {
            throw new AppError('Name is required', 400, 'ERR_BAD_REQUEST');
        }

        const { cat, oldName, newName, changed } = await eggsService.updateEggCategory(req.params.id, name);
        
        if (changed) {
            await writeAudit(req, 'admin.egg_category.update', 'egg_category', cat._id.toString(), { changes: { name: { old: oldName, new: newName } } });
        }

        res.json({ id: cat._id.toString(), name: cat.name });
    } catch (error) {
        next(error);
    }
};

exports.deleteEggCategory = async (req, res, next) => {
    try {
        const cat = await eggsService.deleteEggCategory(req.params.id);
        await writeAudit(req, 'admin.egg_category.delete', 'egg_category', cat._id.toString(), { name: cat.name });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

exports.getEggById = async (req, res, next) => {
    try {
        const egg = await eggsService.getEggById(req.params.id);
        res.json(egg);
    } catch (error) {
        next(error);
    }
};

exports.updateEgg = async (req, res, next) => {
    try {
        const parsed = createSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            throw new AppError('Invalid payload', 400, 'ERR_BAD_REQUEST', parsed.error.flatten());
        }
        
        const { egg, changes } = await eggsService.updateEgg(req.params.id, parsed.data);
        await writeAudit(req, 'admin.egg.update', 'egg', egg._id.toString(), { changes });
        res.json(egg);
    } catch (error) {
        next(error);
    }
};

exports.deleteEgg = async (req, res, next) => {
    try {
        const egg = await eggsService.deleteEgg(req.params.id);
        await writeAudit(req, 'admin.egg.delete', 'egg', egg._id.toString(), { name: egg.name });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};
