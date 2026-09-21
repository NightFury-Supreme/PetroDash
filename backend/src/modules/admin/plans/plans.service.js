const { z } = require('zod');
const Plan = require('../../../models/Plan');
const PlanCategory = require('../../../models/PlanCategory');
const UserPlan = require('../../../models/UserPlan');
const mongoose = require('mongoose');
const { getCache, setCache, deleteCachePattern } = require('../../../lib/redis');
const { writeAudit } = require('../../../middleware/audit');
const AppError = require('../../../utils/AppError');

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

const getCategories = async () => {
  const cached = await getCache('admin:plans:categories');
  if (cached) return cached;

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
  return result;
};

const createCategory = async (name, req) => {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new AppError('Valid name is required', 400);
  }

  try {
    const cat = await PlanCategory.create({ name: name.trim() });
    await deleteCachePattern('admin:plans:categories');
    await deleteCachePattern('admin:plans');

    await writeAudit(req, 'admin.plan_category.create', 'plan_category', cat._id.toString(), { created: { name: cat.name } });

    return { id: cat._id.toString(), name: cat.name, planCount: 0 };
  } catch (error) {
    if (error.code === 11000) throw new AppError('Category already exists', 400);
    throw error;
  }
};

const updateCategory = async (id, name) => {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new AppError('Valid name is required', 400);
  }

  try {
    const cat = await PlanCategory.findById(id);
    if (!cat) throw new AppError('Category not found', 404);

    const oldName = cat.name;
    const newName = name.trim();
    if (oldName !== newName) {
      cat.name = newName;
      await cat.save();
      
      await deleteCachePattern('admin:plans:categories');
      await deleteCachePattern('admin:plans');
    }

    return { id: cat._id.toString(), name: cat.name };
  } catch (error) {
    if (error.code === 11000) throw new AppError('Category already exists', 400);
    throw error;
  }
};

const deleteCategory = async (id, req) => {
  const cat = await PlanCategory.findById(id);
  if (!cat) throw new AppError('Category not found', 404);

  const count = await Plan.countDocuments({ category: cat._id });
  if (count > 0) throw new AppError('Cannot delete category with plans assigned to it', 400);

  await cat.deleteOne();
  
  await deleteCachePattern('admin:plans:categories');
  await deleteCachePattern('admin:plans');

  await writeAudit(req, 'admin.plan_category.delete', 'plan_category', cat._id.toString(), { name: cat.name });
};

const listPlans = async (page, limit) => {
  const skip = (page - 1) * limit;

  const cacheKey = `admin:plans:page:${page}:limit:${limit}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const [plans, total] = await Promise.all([
    Plan.find().populate('category', 'name').sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Plan.countDocuments()
  ]);
  
  const planIds = plans.map(p => p._id);
  const stats = await UserPlan.aggregate([
    { $match: { planId: { $in: planIds.map(id => id.toString()) } } },
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

  const response = {
    plans: enrichedPlans,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };

  await setCache(cacheKey, response, 30);
  return response;
};

const getPlan = async (id) => {
  let plan = await Plan.findById(String(id)).populate('category', 'name').lean();
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }
  
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
  
  return plan;
};

const createPlan = async (data, req) => {
  const validatedData = createSchema.parse(data);
  
  if (validatedData.availableAt) {
    validatedData.availableAt = new Date(validatedData.availableAt);
  }
  if (validatedData.availableUntil) {
    validatedData.availableUntil = new Date(validatedData.availableUntil);
  }
  
  const plan = new Plan(validatedData);
  await plan.save();
  
  await writeAudit(req, 'admin.plan.create', 'plan', plan._id.toString(), { created: validatedData });
  
  await deleteCachePattern('admin:plans');

  return plan;
};

const updatePlan = async (id, data, req) => {
  const plan = await Plan.findById(String(id));
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }
  
  const validatedData = updateSchema.parse(data);
  
  if (validatedData.availableAt) {
    validatedData.availableAt = new Date(validatedData.availableAt);
  }
  if (validatedData.availableUntil) {
    validatedData.availableUntil = new Date(validatedData.availableUntil);
  }
  
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
  
  await deleteCachePattern('admin:plans');

  return plan;
};

const patchPlan = async (id, data, req) => {
  const plan = await Plan.findById(String(id));
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }
  
  const allowedFields = ['enabled', 'visibility', 'popular', 'sortOrder'];
  const updateData = {};
  
  for (const field of allowedFields) {
    if (data.hasOwnProperty(field)) {
      updateData[field] = data[field];
    }
  }
  
  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }
  
  const originalPlan = plan.toObject();
  Object.assign(plan, updateData);
  await plan.save();
  
  const changes = {};
  for (const [k, v] of Object.entries(updateData)) {
    if (originalPlan[k] !== v) changes[k] = { old: originalPlan[k], new: v };
  }
  
  await writeAudit(req, 'admin.plan.update', 'plan', plan._id.toString(), { changes });
  
  await deleteCachePattern('admin:plans');

  return plan;
};

const deletePlan = async (id, req) => {
  const plan = await Plan.findById(String(id));
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }
  
  const assignedUsers = await UserPlan.countDocuments({ 
    planId: String(id)
  });
  
  if (assignedUsers > 0) {
    throw new AppError('Cannot delete plan. Plan is currently assigned to users. Make the plan unlisted instead of deleting it.', 400);
  }
  
  await Plan.findByIdAndDelete(String(id));
  
  await writeAudit(req, 'admin.plan.delete', 'plan', id, { planName: plan.name });
  
  await deleteCachePattern('admin:plans');
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  patchPlan,
  deletePlan
};
