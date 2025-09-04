const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const { writeAudit } = require('../../middleware/audit');
const Plan = require('../../models/Plan');

const router = express.Router();
const { validateObjectId } = require('../../middleware/validateObjectId');

// Validation schemas
const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  strikeThroughPrice: z.number().min(0, 'Strike-through price must be 0 or greater').default(0),
  pricePerMonth: z.number().min(0, 'Monthly price must be 0 or greater'),
  pricePerYear: z.number().min(0, 'Yearly price must be 0 or greater').optional().default(0),
  visibility: z.enum(['public', 'unlisted']).default('public'),
  availableAt: z.string().optional(),
  availableUntil: z.string().optional(),
  stock: z.number().default(0),
  limitPerCustomer: z.number().min(0).default(1),
  category: z.string().default(''),
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

// GET /api/admin/plans - List all plans
router.get('/', requireAdmin, async (req, res) => {
  try {
    const plans = await Plan.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// GET /api/admin/plans/:id - Get single plan
router.get('/:id', requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
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
    
    await writeAudit(req, 'admin.plan.create', 'plan', plan._id.toString(), { planName: plan.name });
    
    res.status(201).json(plan);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// PUT /api/admin/plans/:id - Update plan
router.put('/:id', requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
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
    const deepMerge = (target, source) => {
      for (const key of Object.keys(source)) {
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
    // Ensure Mongoose tracks nested changes
    if (validatedData.productContent) plan.markModified('productContent');
    if (validatedData.billingOptions) plan.markModified('billingOptions');
    if (validatedData.availableBillingCycles) plan.markModified('availableBillingCycles');
    await plan.save();
    
    await writeAudit(req, 'admin.plan.update', 'plan', plan._id.toString(), { planName: plan.name });
    
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
    const plan = await Plan.findById(req.params.id);
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
    
    Object.assign(plan, updateData);
    await plan.save();
    
    await writeAudit(req, {
      action: 'UPDATE',
      resourceType: 'PLAN',
      resourceId: plan._id,
      success: true,
      meta: { planName: plan.name, updatedFields: Object.keys(updateData) }
    });
    
    res.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// DELETE /api/admin/plans/:id - Delete plan
router.delete('/:id', requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Check if any users are currently using this plan
    const UserPlan = require('../../models/UserPlan');
    const activeUsers = await UserPlan.countDocuments({ 
      planId: req.params.id, 
      status: 'active' 
    });
    
    if (activeUsers > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete plan', 
        reason: 'Plan is currently being used by users',
        activeUsers,
        suggestion: 'Make the plan unlisted instead of deleting it'
      });
    }
    
    await Plan.findByIdAndDelete(req.params.id);
    
    await writeAudit(req, 'admin.plan.delete', 'plan', req.params.id, { planName: plan.name });
    
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

module.exports = router;

