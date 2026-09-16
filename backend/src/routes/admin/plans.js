const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const { writeAudit } = require('../../middleware/audit');
const Plan = require('../../models/Plan');
require('../../models/PlanCategory'); // Ensure model is registered before populate

const router = express.Router();
const { validateObjectId } = require('../../middleware/validateObjectId');

// Validation schemas
const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  strikeThroughPrice: z.number().min(0, 'Strike-through price must be 0 or greater').default(0),
  pricePerMonth: z.number().min(0, 'Monthly price must be 0 or greater'),
  pricePerYear: z.number().min(0, 'Yearly price must be 0 or greater').optional().default(0),
  visibility: z.enum(['public', 'unlisted']).default('public'),
  availableAt: z.string().optional(),
  availableUntil: z.string().optional(),
  stock: z.number().default(0),
  limitPerCustomer: z.number().min(0).default(1),
  category: z.string().min(1, 'Category is required'),
  redirectionLink: z.string().optional(),
  billingOptions: z.object({
    renewable: z.boolean().default(true),
    nonRenewable: z.boolean().default(false),
    lifetime: z.boolean().default(false)
  }),
  availableBillingCycles: z.array(z.enum(['monthly', 'quarterly', 'semi-annual', 'annual'])).default(['monthly']),
  productContent: z.object({
    recurrentResources: z.object({
      cpuPercent: z.number().min(0, 'CPU must be 0 or greater'),
      memoryMb: z.number().min(0, 'Memory must be 0 or greater'),
      diskMb: z.number().min(0, 'Disk must be 0 or greater'),
      swapMb: z.number().default(0),
      blockIoProportion: z.number().default(100),
      cpuPinning: z.string().default('')
    }),
    additionalAllocations: z.number().min(0).default(0),
    databases: z.number().min(0, 'Databases must be 0 or greater'),
    backups: z.number().min(0, 'Backups must be 0 or greater'),
    coins: z.number().min(0).default(0),
    serverLimit: z.number().min(1, 'Server limit must be 1 or greater')
  }),
  staffNotes: z.string().default(''),
  popular: z.boolean().default(false),
  sortOrder: z.number().default(0)
});

const updateSchema = createSchema.partial();


// ==========================================
// PLAN CATEGORIES API
// ==========================================
router.get('/categories', requireAdmin, async (req, res) => {
  try {
    const { getCache, setCache } = require('../../lib/redis');
    const cached = await getCache('admin:plans:categories');
    if (cached) return res.json(cached);

    const PlanCategory = require('../../models/PlanCategory');
    const Plan = require('../../models/Plan');
    const mongoose = require('mongoose');

    // Auto-migrate string categories to ObjectIds
    const rawPlans = await mongoose.connection.db.collection('plans').find({ category: { $type: 'string' } }).toArray();
    for (const raw of rawPlans) {
      if (raw.category && raw.category !== 'Others') {
        const cat = await PlanCategory.findOneAndUpdate(
          { name: raw.category },
          { $setOnInsert: { name: raw.category } },
          { upsert: true, new: true }
        );
        await mongoose.connection.db.collection('plans').updateOne(
          { _id: raw._id },
          { $set: { category: cat._id } }
        );
      } else if (raw.category === 'Others') {
        const cat = await PlanCategory.findOneAndUpdate(
          { name: 'Others' },
          { $setOnInsert: { name: 'Others' } },
          { upsert: true, new: true }
        );
        await mongoose.connection.db.collection('plans').updateOne(
          { _id: raw._id },
          { $set: { category: cat._id } }
        );
      }
    }

    const categories = await PlanCategory.find().sort({ name: 1 }).lean();

    // Calculate counts
    const counts = await Plan.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    const countMap = counts.reduce((acc, curr) => {
      if (curr._id) acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const result = categories.map(c => ({
      id: c._id.toString(),
      name: c.name,
      planCount: countMap[c._id.toString()] || 0
    }));

    await setCache('admin:plans:categories', result, 60);
    res.json(result);
  } catch (error) {
    console.error('Error fetching plan categories:', error);
    res.status(500).json({ error: 'Failed to fetch plan categories' });
  }
});

router.post('/categories', requireAdmin, async (req, res) => {
  try {
    const PlanCategory = require('../../models/PlanCategory');
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Valid name is required' });
    }

    const cat = await PlanCategory.create({ name: name.trim() });
    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:plans:categories');
    await deleteCachePattern('admin:plans');

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.plan_category.create', 'plan_category', cat._id.toString(), { created: { name: cat.name } });

    res.status(201).json({ id: cat._id.toString(), name: cat.name, planCount: 0 });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Category already exists' });
    console.error('Error creating plan category:', error);
    res.status(500).json({ error: 'Failed to create plan category' });
  }
});

router.put('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const PlanCategory = require('../../models/PlanCategory');
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Valid name is required' });
    }

    const cat = await PlanCategory.findById(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    const oldName = cat.name;
    const newName = name.trim();
    if (oldName !== newName) {
      cat.name = newName;
      await cat.save();
      
      const { deleteCachePattern } = require('../../lib/redis');
      await deleteCachePattern('admin:plans:categories');
      await deleteCachePattern('admin:plans');
    }

    res.json({ id: cat._id.toString(), name: cat.name });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Category already exists' });
    console.error('Error updating plan category:', error);
    res.status(500).json({ error: 'Failed to update plan category' });
  }
});

router.delete('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const PlanCategory = require('../../models/PlanCategory');
    const Plan = require('../../models/Plan');
    
    const cat = await PlanCategory.findById(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    const count = await Plan.countDocuments({ category: cat._id });
    if (count > 0) return res.status(400).json({ error: 'Cannot delete category with plans assigned to it' });

    await cat.deleteOne();
    
    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:plans:categories');
    await deleteCachePattern('admin:plans');

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.plan_category.delete', 'plan_category', cat._id.toString(), { name: cat.name });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan category:', error);
    res.status(500).json({ error: 'Failed to delete plan category' });
  }
});
// ==========================================


// GET /api/admin/plans - List all plans
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { getCache, setCache } = require('../../lib/redis');
    const cached = await getCache('admin:plans');
    if (cached) return res.json(cached);

    const plans = await Plan.find().populate('category', 'name').sort({ sortOrder: 1, createdAt: -1 }).lean();
    
    const UserPlan = require('../../models/UserPlan');
    const stats = await UserPlan.aggregate([
      {
        $group: {
          _id: "$planId",
          totalPurchases: { $sum: 1 },
          currentUsers: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          }
        }
      }
    ]);
    
    const statsMap = {};
    stats.forEach(s => {
      statsMap[s._id.toString()] = {
        totalPurchases: s.totalPurchases,
        currentUsers: s.currentUsers
      };
    });

    const enrichedPlans = plans.map(p => {
      const pStats = statsMap[p._id.toString()] || { totalPurchases: 0, currentUsers: 0 };
      return {
        ...p,
        totalPurchases: pStats.totalPurchases,
        currentUsers: pStats.currentUsers
      };
    });

    await setCache('admin:plans', enrichedPlans, 30);
    res.json(enrichedPlans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// GET /api/admin/plans/:id - Get single plan
router.get('/:id', requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    let plan = await Plan.findById(String(req.params.id)).populate('category', 'name').lean();
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const UserPlan = require('../../models/UserPlan');
    const stats = await UserPlan.aggregate([
      { $match: { planId: plan._id } },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          currentUsers: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          }
        }
      }
    ]);
    
    if (stats.length > 0) {
      plan.totalPurchases = stats[0].totalPurchases;
      plan.currentUsers = stats[0].currentUsers;
    } else {
      plan.totalPurchases = 0;
      plan.currentUsers = 0;
    }
    
    res.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

// POST /api/admin/plans - Create new plan
router.post('/', requireAdmin, async (req, res) => {
  try {
    const validatedData = createSchema.parse(req.body);
    
    // Convert date strings to Date objects if provided
    if (validatedData.availableAt) {
      validatedData.availableAt = new Date(validatedData.availableAt);
    }
    if (validatedData.availableUntil) {
      validatedData.availableUntil = new Date(validatedData.availableUntil);
    }
    
    const plan = new Plan(validatedData);
    await plan.save();
    
    await writeAudit(req, 'admin.plan.create', 'plan', plan._id.toString(), { created: validatedData });
    
    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:plans');

    res.status(201).json(plan);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    if (error.name === 'ValidationError') {
      // Mongoose schema validation — return field-level details as 400, not 500
      const fields = Object.fromEntries(
        Object.entries(error.errors).map(([k, v]) => [k, v.message])
      );
      return res.status(400).json({ error: 'Plan validation failed', fields });
    }
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// PUT /api/admin/plans/:id - Update plan
router.put('/:id', requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const plan = await Plan.findById(String(req.params.id));
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const validatedData = updateSchema.parse(req.body);
    
    // Convert date strings to Date objects if provided
    if (validatedData.availableAt) {
      validatedData.availableAt = new Date(validatedData.availableAt);
    }
    if (validatedData.availableUntil) {
      validatedData.availableUntil = new Date(validatedData.availableUntil);
    }
    
    // Deep merge to preserve nested objects and ensure changes are tracked
    const originalPlan = plan.toObject();
    const deepMerge = (target, source) => {
      for (const key of Object.keys(source)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key] || typeof target[key] !== 'object') target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    };
    deepMerge(plan, validatedData);
    if (validatedData.productContent) plan.markModified('productContent');
    if (validatedData.billingOptions) plan.markModified('billingOptions');
    if (validatedData.availableBillingCycles) plan.markModified('availableBillingCycles');
    await plan.save();
    
    const changes = {};
    const newPlan = plan.toObject();
    
    const checkDiff = (target, sourceObj, origObj, newObj, prefix = '') => {
      for (const k of Object.keys(sourceObj || {})) {
        if (typeof sourceObj[k] === 'object' && sourceObj[k] !== null && !Array.isArray(sourceObj[k])) {
          checkDiff(target, sourceObj[k], (origObj[k] || {}), (newObj[k] || {}), prefix ? `${prefix}.${k}` : k);
        } else {
          const keyName = prefix ? `${prefix}.${k}` : k;
          if (JSON.stringify(origObj[k]) !== JSON.stringify(newObj[k])) {
            target[keyName] = { old: origObj[k], new: newObj[k] };
          }
        }
      }
    };
    
    checkDiff(changes, validatedData, originalPlan, newPlan);
    await writeAudit(req, 'admin.plan.update', 'plan', plan._id.toString(), { changes: Object.keys(changes).length > 0 ? changes : undefined });
    
    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:plans');

    res.json(plan);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// PATCH /api/admin/plans/:id - Partial update plan (for quick actions like visibility toggle)
router.patch('/:id', requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const plan = await Plan.findById(String(req.params.id));
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Allow specific fields for PATCH updates
    const allowedFields = ['enabled', 'visibility', 'popular', 'sortOrder'];
    const updateData = {};
    
    for (const field of allowedFields) {
      if (req.body.hasOwnProperty(field)) {
        updateData[field] = req.body[field];
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const originalPlan = plan.toObject();
    Object.assign(plan, updateData);
    await plan.save();
    
    const changes = {};
    for (const [k, v] of Object.entries(updateData)) {
      if (originalPlan[k] !== v) changes[k] = { old: originalPlan[k], new: v };
    }
    
    await writeAudit(req, 'admin.plan.update', 'plan', plan._id.toString(), { changes });
    
    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:plans');

    res.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// DELETE /api/admin/plans/:id - Delete plan
router.delete('/:id', requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const plan = await Plan.findById(String(req.params.id));
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Check if any users are currently using this plan
    const UserPlan = require('../../models/UserPlan');
    const assignedUsers = await UserPlan.countDocuments({ 
      planId: String(req.params.id)
    });
    
    if (assignedUsers > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete plan', 
        reason: 'Plan is currently assigned to users',
        assignedUsers,
        suggestion: 'Make the plan unlisted instead of deleting it'
      });
    }
    
    await Plan.findByIdAndDelete(String(req.params.id));
    
    await writeAudit(req, 'admin.plan.delete', 'plan', req.params.id, { planName: plan.name });
    
    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:plans');

    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

module.exports = router;

