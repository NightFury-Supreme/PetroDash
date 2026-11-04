const mongoose = require('mongoose');
const Plan = require('../../../models/Plan');
const UserPlan = require('../../../models/UserPlan');
const { getOrSetCache, acquireLock, releaseLock } = require('../../../lib/redis');
const { writeAudit } = require('../../../middleware/audit');
const AppError = require('../../../utils/AppError');
const { buildIdFilter, formatPublicEntity } = require('../../../utils/publicId');
const categoriesService = require('./plans.categories.service');
const { invalidatePlanCaches } = categoriesService;

const listPlans = async (page = 1, limit = 10) => {
  const cacheKey = `admin:plans:list:${page}:${limit}`;
  return getOrSetCache(cacheKey, async () => {
    const skip = (page - 1) * limit;

    const total = await Plan.countDocuments();
    const plans = await Plan.find()
      .populate('category', 'name publicId')
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const planIds = plans.map((p) => p._id);
    const purchaseStats = await UserPlan.aggregate([
      { $match: { planId: { $in: planIds } } },
      {
        $group: {
          _id: '$planId',
          totalPurchases: { $sum: 1 },
          currentUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap = purchaseStats.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr;
      return acc;
    }, {});

    const enrichedPlans = plans.map((plan) => {
      const stat = statsMap[plan._id.toString()];
      const clean = formatPublicEntity({
        ...plan,
        totalPurchases: stat ? stat.totalPurchases : 0,
        currentUsers: stat ? stat.currentUsers : 0,
      }, 'plan');
      if (clean.category && typeof clean.category === 'object') {
        clean.category = formatPublicEntity(clean.category, 'planCategory');
      }
      return clean;
    });

    return {
      plans: enrichedPlans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }, 30);
};

const getPlan = async (id) => {
  const plan = await Plan.findOne(buildIdFilter(id)).populate('category', 'name publicId').lean();
  if (!plan) {
    throw new AppError('Plan not found', 404, 'ERR_PLAN_NOT_FOUND');
  }

  const stats = await UserPlan.aggregate([
    { $match: { planId: plan._id } },
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: 1 },
        currentUsers: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
      },
    },
  ]);

  if (stats.length > 0) {
    plan.totalPurchases = stats[0].totalPurchases;
    plan.currentUsers = stats[0].currentUsers;
  } else {
    plan.totalPurchases = 0;
    plan.currentUsers = 0;
  }

  const clean = formatPublicEntity(plan, 'plan');
  if (clean.category && typeof clean.category === 'object') {
    clean.category = formatPublicEntity(clean.category, 'planCategory');
  }
  return clean;
};

const createPlan = async (data, req) => {
  const validatedData = { ...data };

  if (validatedData.category) {
    const PlanCategory = require('../../../models/PlanCategory');
    const cat = await PlanCategory.findOne(buildIdFilter(validatedData.category)).select('_id').lean();
    if (cat) validatedData.category = cat._id;
  }

  if (validatedData.availableAt) {
    validatedData.availableAt = new Date(validatedData.availableAt);
  }
  if (validatedData.availableUntil) {
    validatedData.availableUntil = new Date(validatedData.availableUntil);
  }

  const plan = new Plan(validatedData);
  await plan.save();

  const pubId = plan.publicId;
  await writeAudit(req, 'admin.plan.create', 'plan', pubId, { created: validatedData });
  await invalidatePlanCaches(pubId);

  const created = await Plan.findById(plan._id).populate('category', 'name publicId').lean();
  const clean = formatPublicEntity(created, 'plan');
  if (clean.category && typeof clean.category === 'object') {
    clean.category = formatPublicEntity(clean.category, 'planCategory');
  }
  return clean;
};

const updatePlan = async (id, data, req) => {
  const lockKey = `admin:plans:lock:${id}`;
  const lockToken = await acquireLock(lockKey, 3000);
  if (!lockToken) {
    throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');
  }

  try {
    const plan = await Plan.findOne(buildIdFilter(id));
    if (!plan) {
      throw new AppError('Plan not found', 404, 'ERR_PLAN_NOT_FOUND');
    }

    const validatedData = { ...data };

    if (validatedData.category) {
      const PlanCategory = require('../../../models/PlanCategory');
      const cat = await PlanCategory.findOne(buildIdFilter(validatedData.category)).select('_id').lean();
      if (cat) validatedData.category = cat._id;
    }

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
          checkDiff(target, sourceObj[k], origObj[k] || {}, newObj[k] || {}, prefix ? `${prefix}.${k}` : k);
        } else {
          const keyName = prefix ? `${prefix}.${k}` : k;
          if (JSON.stringify(origObj[k]) !== JSON.stringify(newObj[k])) {
            target[keyName] = { old: origObj[k], new: newObj[k] };
          }
        }
      }
    };

    checkDiff(changes, validatedData, originalPlan, newPlan);
    const pubId = plan.publicId;
    await writeAudit(req, 'admin.plan.update', 'plan', pubId, {
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    });

    await invalidatePlanCaches(pubId);

    const updated = await Plan.findById(plan._id).lean();
    return formatPublicEntity(updated, 'plan');
  } finally {
    await releaseLock(lockKey, lockToken);
  }
};

const patchPlan = async (id, data, req) => {
  const lockKey = `admin:plans:lock:${id}`;
  const lockToken = await acquireLock(lockKey, 3000);
  if (!lockToken) {
    throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');
  }

  try {
    const plan = await Plan.findOne(buildIdFilter(id));
    if (!plan) {
      throw new AppError('Plan not found', 404, 'ERR_PLAN_NOT_FOUND');
    }

    const allowedFields = ['enabled', 'visibility', 'popular', 'sortOrder'];
    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No valid fields to update', 400, 'ERR_NO_FIELDS_TO_UPDATE');
    }

    const originalPlan = plan.toObject();
    Object.assign(plan, updateData);
    await plan.save();

    const changes = {};
    for (const [k, v] of Object.entries(updateData)) {
      if (originalPlan[k] !== v) changes[k] = { old: originalPlan[k], new: v };
    }

    const pubId = plan.publicId;
    await writeAudit(req, 'admin.plan.update', 'plan', pubId, { changes });
    await invalidatePlanCaches(pubId);

    const updated = await Plan.findById(plan._id).lean();
    return formatPublicEntity(updated, 'plan');
  } finally {
    await releaseLock(lockKey, lockToken);
  }
};

const deletePlan = async (id, req) => {
  const lockKey = `admin:plans:lock:${id}`;
  const lockToken = await acquireLock(lockKey, 3000);
  if (!lockToken) {
    throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');
  }

  try {
    const plan = await Plan.findOne(buildIdFilter(id));
    if (!plan) {
      throw new AppError('Plan not found', 404, 'ERR_PLAN_NOT_FOUND');
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const activeUsers = await UserPlan.countDocuments({
          planId: plan._id,
          status: 'active',
        }).session(session);

        if (activeUsers > 0) {
          throw AppError.badRequest('ERR_PLAN_ASSIGNED_TO_USERS', 'ERR_PLAN_ASSIGNED_TO_USERS');
        }

        await Plan.findByIdAndDelete(plan._id, { session });
      });
    } finally {
      await session.endSession();
    }

    const pubId = plan.publicId;
    await writeAudit(req, 'admin.plan.delete', 'plan', pubId, { planName: plan.name });
    await invalidatePlanCaches(pubId);
  } finally {
    await releaseLock(lockKey, lockToken);
  }
};

module.exports = {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  patchPlan,
  deletePlan,
  getCategories: categoriesService.getCategories,
  createCategory: categoriesService.createCategory,
  updateCategory: categoriesService.updateCategory,
  deleteCategory: categoriesService.deleteCategory,
};
