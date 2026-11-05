const mongoose = require('mongoose');
const User = require('../../../models/User');
const UserPlan = require('../../../models/UserPlan');
const Plan = require('../../../models/Plan');
const AppError = require('../../../utils/AppError');
const { acquireLock, releaseLock } = require('../../../lib/redis');
const { invalidateUserCaches } = require('../../../utils/userCacheInvalidation');
const { writeAudit } = require('../../../middleware/audit');
const { isValidEntityId, buildIdFilter, formatPublicEntity } = require('../../../utils/publicId');

async function invalidateUserAndPlanCaches(userId) {
  await invalidateUserCaches(userId);
}

const getAdminActor = (req) => ({
  adminId: req?.user?.sub,
  adminUsername: req?.user?.username || 'admin',
  adminRole: req?.user?.role || 'admin',
});

function extractFlatResources(plan) {
  const pc = plan.productContent || {};
  const rr = pc.recurrentResources || {};
  return {
    cpuPercent: rr.cpuPercent || 0,
    memoryMb: rr.memoryMb || 0,
    diskMb: rr.diskMb || 0,
    additionalAllocations: pc.additionalAllocations || 0,
    databases: pc.databases || 0,
    backups: pc.backups || 0,
    coins: pc.coins || 0,
    serverLimit: pc.serverLimit || 0,
  };
}

async function decrementUserPlanResources(userId, resources, session) {
  if (!resources) return;
  const decQuery = {
    coins: -Number(resources.coins || 0),
    'resources.diskMb': -Number(resources.diskMb || 0),
    'resources.memoryMb': -Number(resources.memoryMb || 0),
    'resources.cpuPercent': -Number(resources.cpuPercent || 0),
    'resources.backups': -Number(resources.backups || 0),
    'resources.databases': -Number(resources.databases || 0),
    'resources.allocations': -Number(resources.additionalAllocations || 0),
    'resources.serverSlots': -Number(resources.serverLimit || 0),
  };
  Object.keys(decQuery).forEach((k) => {
    if (decQuery[k] === 0 || isNaN(decQuery[k])) delete decQuery[k];
  });
  if (Object.keys(decQuery).length > 0) {
    await User.findByIdAndUpdate(userId, { $inc: decQuery }, { session });
  }
}

const addPlan = async (req, id, { planId, months }) => {
  if (!isValidEntityId(String(id), 'user')) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  if (!isValidEntityId(String(planId), 'plan')) throw new AppError('Plan not found', 404, 'ERR_PLAN_NOT_FOUND');

  const lockToken = await acquireLock(`user:mutation:${id}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }

  try {
    const user = await User.findOne(buildIdFilter(id));
    if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
    const plan = await Plan.findOne(buildIdFilter(planId));
    if (!plan) throw new AppError('Plan not found', 404, 'ERR_PLAN_NOT_FOUND');

    const now = new Date();
    let expiresAt = null;
    if (!plan.billingOptions?.lifetime) {
      expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + Math.max(0, months));
    }

    const flatResources = extractFlatResources(plan);
    const pc = plan.productContent || {};
    const rr = pc.recurrentResources || {};
    const incQuery = {
      coins: Number(pc.coins || 0),
      'resources.diskMb': Number(rr.diskMb || 0),
      'resources.memoryMb': Number(rr.memoryMb || 0),
      'resources.cpuPercent': Number(rr.cpuPercent || 0),
      'resources.backups': Number(pc.backups || 0),
      'resources.databases': Number(pc.databases || 0),
      'resources.allocations': Number(pc.additionalAllocations || 0),
      'resources.serverSlots': Number(pc.serverLimit || 0),
    };

    Object.keys(incQuery).forEach((k) => {
      if (incQuery[k] === 0 || isNaN(incQuery[k])) delete incQuery[k];
    });

    let createdSubId = null;
    let publicSubId = null;

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const [sub] = await UserPlan.create(
          [
            {
              userId: user._id,
              planId: plan._id,
              purchaseDate: now,
              expiresAt,
              status: 'active',
              billingCycle: plan.billingOptions?.lifetime ? 'lifetime' : 'monthly',
              amount: plan.billingOptions?.lifetime ? plan.pricePerMonth : plan.pricePerMonth * months,
              resources: flatResources,
              isRenewable: plan.billingOptions?.renewable || false,
              isLifetime: plan.billingOptions?.lifetime || false,
            },
          ],
          { session }
        );
        createdSubId = sub._id;
        publicSubId = sub.publicId;

        if (Object.keys(incQuery).length > 0) {
          await User.findByIdAndUpdate(user._id, { $inc: incQuery }, { session });
        }
      });
    } finally {
      await session.endSession();
    }

    const actor = getAdminActor(req);
    const publicUserId = user.publicId;

    await writeAudit(req, 'admin.user.plan.add', 'user_plan', publicSubId, {
      targetUserId: publicUserId,
      plan: plan.name,
      planName: plan.name,
      months,
      ...actor,
    });

    await invalidateUserAndPlanCaches(publicUserId);

    const populatedSub = await UserPlan.findById(createdSubId).populate('planId', 'name pricePerMonth pricePerYear publicId').lean();
    const formattedSub = formatPublicEntity(populatedSub, 'userPlan');
    if (formattedSub && formattedSub.planId) {
      formattedSub.planId = formatPublicEntity(formattedSub.planId, 'plan');
    }
    return { plan: formattedSub };
  } finally {
    await releaseLock(`user:mutation:${id}`, lockToken);
  }
};

const cancelPlans = async (req, id, planId) => {
  if (!isValidEntityId(String(id), 'user')) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  if (!isValidEntityId(String(planId), 'plan')) throw new AppError('Plan not found', 404, 'ERR_PLAN_NOT_FOUND');

  const lockToken = await acquireLock(`user:mutation:${id}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }

  try {
    const user = await User.findOne(buildIdFilter(id));
    if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
    const plan = await Plan.findOne(buildIdFilter(planId));
    if (!plan) throw new AppError('Plan not found', 404, 'ERR_PLAN_NOT_FOUND');

    const subs = await UserPlan.find({ userId: user._id, planId: plan._id, status: 'active' });
    if (subs.length === 0) throw new AppError('Active plan not found', 404, 'ERR_PLAN_NOT_FOUND');

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const sub of subs) {
          sub.status = 'cancelled';
          await sub.save({ session });
          await decrementUserPlanResources(user._id, sub.resources, session);
        }
      });
    } finally {
      await session.endSession();
    }

    const actor = getAdminActor(req);
    const publicPlanId = plan.publicId;
    const publicUserId = user.publicId;

    await writeAudit(req, 'admin.user.plan.cancel', 'user_plan', publicPlanId, {
      targetUserId: publicUserId,
      userId: publicUserId,
      planId: publicPlanId,
      instancesCancelled: subs.length,
      ...actor,
    });

    await invalidateUserAndPlanCaches(publicUserId);
    return { ok: true, instancesCancelled: subs.length };
  } finally {
    await releaseLock(`user:mutation:${id}`, lockToken);
  }
};

const cancelPlanInstance = async (req, id, instanceId) => {
  if (!isValidEntityId(String(id), 'user')) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  if (!isValidEntityId(String(instanceId), 'userPlan')) throw new AppError('Active plan instance not found', 404, 'ERR_PLAN_INSTANCE_NOT_FOUND');

  const lockToken = await acquireLock(`user:mutation:${id}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }

  try {
    const user = await User.findOne(buildIdFilter(id));
    if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');

    const sub = await UserPlan.findOne({ ...buildIdFilter(instanceId), userId: user._id, status: 'active' });
    if (!sub) throw new AppError('Active plan instance not found', 404, 'ERR_PLAN_INSTANCE_NOT_FOUND');

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        sub.status = 'cancelled';
        await sub.save({ session });
        await decrementUserPlanResources(user._id, sub.resources, session);
      });
    } finally {
      await session.endSession();
    }

    const actor = getAdminActor(req);
    const publicSubId = sub.publicId;
    const publicUserId = user.publicId;

    await writeAudit(req, 'admin.user.plan.instance.cancel', 'user_plan', publicSubId, {
      targetUserId: publicUserId,
      userId: publicUserId,
      planId: sub.planId,
      ...actor,
    });

    await invalidateUserAndPlanCaches(publicUserId);
    return { ok: true };
  } finally {
    await releaseLock(`user:mutation:${id}`, lockToken);
  }
};

module.exports = {
  addPlan,
  cancelPlans,
  cancelPlanInstance,
};
