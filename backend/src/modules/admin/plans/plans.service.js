/**
 * Admin Plans Main Service
 * Complies with ISO/IEC 25010 (Single Responsibility, Clean Architecture)
 */

const Plan = require('../../../models/Plan');
const UserPlan = require('../../../models/UserPlan');
const { getCache, setCache, deleteCachePattern } = require('../../../lib/redis');
const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');
const AppError = require('../../../utils/AppError');
const categoriesService = require('./plans.categories.service');

const listPlans = async (page = 1, limit = 10) => {
  const cacheKey = `admin:plans:list:${page}:${limit}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const skip = (page - 1) * limit;

  const total = await Plan.countDocuments();
  const plans = await Plan.find()
    .populate('category', 'name')
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
    return {
      ...plan,
      totalPurchases: stat ? stat.totalPurchases : 0,
      currentUsers: stat ? stat.currentUsers : 0,
    };
  });

  const response = {
    plans: enrichedPlans,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  await setCache(cacheKey, response, 30);
  return response;
};

const getPlan = async (id) => {
  const plan = await Plan.findById(String(id)).populate('category', 'name').lean();
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

  return plan;
};

const createPlan = async (data, req) => {
  const validatedData = { ...data };

  if (validatedData.availableAt) {
    validatedData.availableAt = new Date(validatedData.availableAt);
  }
  if (validatedData.availableUntil) {
    validatedData.availableUntil = new Date(validatedData.availableUntil);
  }

  const plan = new Plan(validatedData);
  await plan.save();

  await writeAudit(req, 'admin.plan.create', 'plan', plan._id.toString(), { created: validatedData });
  await logUserActivity(req, 'admin.plan.create', { planId: plan._id.toString(), name: plan.name });
  await deleteCachePattern('admin:plans*');
  await deleteCachePattern('api:plans*');

  return plan;
};

const updatePlan = async (id, data, req) => {
  const plan = await Plan.findById(String(id));
  if (!plan) {
    throw new AppError('Plan not found', 404, 'ERR_PLAN_NOT_FOUND');
  }

  const validatedData = { ...data };

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
  await writeAudit(req, 'admin.plan.update', 'plan', plan._id.toString(), {
    changes: Object.keys(changes).length > 0 ? changes : undefined,
  });
  await logUserActivity(req, 'admin.plan.update', {
    planId: plan._id.toString(),
    changes: Object.keys(changes).length > 0 ? changes : undefined,
  });

  await deleteCachePattern('admin:plans*');
  await deleteCachePattern('api:plans*');

  return plan;
};

const patchPlan = async (id, data, req) => {
  const plan = await Plan.findById(String(id));
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

  await writeAudit(req, 'admin.plan.update', 'plan', plan._id.toString(), { changes });
  await logUserActivity(req, 'admin.plan.update', { planId: plan._id.toString(), changes });
  await deleteCachePattern('admin:plans*');
  await deleteCachePattern('api:plans*');

  return plan;
};

const deletePlan = async (id, req) => {
  const plan = await Plan.findById(String(id));
  if (!plan) {
    throw new AppError('Plan not found', 404, 'ERR_PLAN_NOT_FOUND');
  }

  const assignedUsers = await UserPlan.countDocuments({
    planId: String(id),
  });

  if (assignedUsers > 0) {
    throw new AppError(
      'Cannot delete plan. Plan is currently assigned to users. Make the plan unlisted instead of deleting it.',
      400,
      'ERR_PLAN_ASSIGNED_TO_USERS'
    );
  }

  await Plan.findByIdAndDelete(String(id));
  await writeAudit(req, 'admin.plan.delete', 'plan', id, { planName: plan.name });
  await logUserActivity(req, 'admin.plan.delete', { planId: id, planName: plan.name });
  await deleteCachePattern('admin:plans*');
  await deleteCachePattern('api:plans*');
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
