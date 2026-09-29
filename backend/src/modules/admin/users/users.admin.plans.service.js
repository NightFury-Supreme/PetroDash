/**
 * Admin Users Plans Sub-Service
 * Complies with ISO/IEC 25010 (Maintainability, Single Responsibility)
 */

const { Types } = require('mongoose');
const User = require('../../../models/User');
const UserPlan = require('../../../models/UserPlan');
const Plan = require('../../../models/Plan');
const AppError = require('../../../utils/AppError');
const { deleteCachePattern } = require('../../../lib/redis');
const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');

const addPlan = async (req, id, { planId, months }) => {
  if (!Types.ObjectId.isValid(String(id))) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  if (!Types.ObjectId.isValid(String(planId))) throw new AppError('Plan not found', 404, 'ERR_PLAN_NOT_FOUND');
  const user = await User.findById(String(id));
  if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  const plan = await Plan.findById(planId);
  if (!plan) throw new AppError('Plan not found', 404, 'ERR_PLAN_NOT_FOUND');

  const now = new Date();
  let expiresAt = null;
  if (!plan.billingOptions?.lifetime) {
    expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + Math.max(0, months));
  }

  const pc = plan.productContent || {};
  const rr = pc.recurrentResources || {};
  const flatResources = {
    cpuPercent: rr.cpuPercent || 0,
    memoryMb: rr.memoryMb || 0,
    diskMb: rr.diskMb || 0,
    swapMb: rr.swapMb !== undefined ? rr.swapMb : -1,
    blockIoProportion: rr.blockIoProportion || 0,
    cpuPinning: rr.cpuPinning || '',
    additionalAllocations: pc.additionalAllocations || 0,
    databases: pc.databases || 0,
    backups: pc.backups || 0,
    coins: pc.coins || 0,
    serverLimit: pc.serverLimit || 0,
  };

  const sub = await UserPlan.create({
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
  });

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

  if (Object.keys(incQuery).length > 0) {
    await User.findByIdAndUpdate(user._id, { $inc: incQuery });
  }

  const adminId = req?.user?.sub || req?.user?.userId || req?.user?._id;
  const adminUsername = req?.user?.username || 'admin';
  const adminRole = req?.user?.role || 'admin';

  await writeAudit(req, 'admin.user.plan.add', 'user_plan', sub._id.toString(), {
    targetUserId: user._id.toString(),
    plan: plan.name,
    planName: plan.name,
    months,
    adminId,
    adminUsername,
    adminRole,
  });
  await logUserActivity(req, 'admin.user.plan.add', {
    plan: plan.name,
    months,
    updatedByAdmin: true,
    adminId,
    adminUsername,
    adminRole,
  }, user._id.toString());
  await deleteCachePattern('admin:users*');
  await deleteCachePattern(`user:${user._id}:plans*`);

  const populatedSub = await UserPlan.findById(sub._id).populate('planId', 'name pricePerMonth pricePerYear').lean();
  return { plan: populatedSub };
};

const cancelPlans = async (req, id, planId) => {
  if (!Types.ObjectId.isValid(String(id))) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  if (!Types.ObjectId.isValid(String(planId))) throw new AppError('Plan not found', 404, 'ERR_PLAN_NOT_FOUND');
  const subs = await UserPlan.find({ userId: String(id), planId: String(planId), status: 'active' });
  if (subs.length === 0) throw new AppError('Active plan not found', 404, 'ERR_PLAN_NOT_FOUND');

  for (const sub of subs) {
    sub.status = 'cancelled';
    await sub.save();

    if (sub.resources) {
      const decQuery = {
        coins: -Number(sub.resources.coins || 0),
        'resources.diskMb': -Number(sub.resources.diskMb || 0),
        'resources.memoryMb': -Number(sub.resources.memoryMb || 0),
        'resources.cpuPercent': -Number(sub.resources.cpuPercent || 0),
        'resources.backups': -Number(sub.resources.backups || 0),
        'resources.databases': -Number(sub.resources.databases || 0),
        'resources.allocations': -Number(sub.resources.additionalAllocations || 0),
        'resources.serverSlots': -Number(sub.resources.serverLimit || 0),
      };

      Object.keys(decQuery).forEach((k) => {
        if (decQuery[k] === 0 || isNaN(decQuery[k])) delete decQuery[k];
      });

      if (Object.keys(decQuery).length > 0) {
        await User.findByIdAndUpdate(String(id), { $inc: decQuery });
      }
    }
  }

  const adminId = req?.user?.sub || req?.user?.userId || req?.user?._id;
  const adminUsername = req?.user?.username || 'admin';
  const adminRole = req?.user?.role || 'admin';

  await writeAudit(req, 'admin.user.plan.cancel', 'user_plan', planId, {
    targetUserId: String(id),
    userId: id,
    planId,
    instancesCancelled: subs.length,
    adminId,
    adminUsername,
    adminRole,
  });
  await logUserActivity(req, 'admin.user.plan.cancel', {
    planId,
    instancesCancelled: subs.length,
    updatedByAdmin: true,
    adminId,
    adminUsername,
    adminRole,
  }, id);
  await deleteCachePattern('admin:users*');
  await deleteCachePattern(`user:${id}:plans*`);

  return { ok: true, instancesCancelled: subs.length };
};

const cancelPlanInstance = async (req, id, instanceId) => {
  if (!Types.ObjectId.isValid(String(id))) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  if (!Types.ObjectId.isValid(String(instanceId))) throw new AppError('Active plan instance not found', 404, 'ERR_PLAN_INSTANCE_NOT_FOUND');
  const sub = await UserPlan.findOne({ _id: String(instanceId), userId: String(id), status: 'active' });
  if (!sub) throw new AppError('Active plan instance not found', 404, 'ERR_PLAN_INSTANCE_NOT_FOUND');

  sub.status = 'cancelled';
  await sub.save();

  if (sub.resources) {
    const decQuery = {
      coins: -Number(sub.resources.coins || 0),
      'resources.diskMb': -Number(sub.resources.diskMb || 0),
      'resources.memoryMb': -Number(sub.resources.memoryMb || 0),
      'resources.cpuPercent': -Number(sub.resources.cpuPercent || 0),
      'resources.backups': -Number(sub.resources.backups || 0),
      'resources.databases': -Number(sub.resources.databases || 0),
      'resources.allocations': -Number(sub.resources.additionalAllocations || 0),
      'resources.serverSlots': -Number(sub.resources.serverLimit || 0),
    };

    Object.keys(decQuery).forEach((k) => {
      if (decQuery[k] === 0 || isNaN(decQuery[k])) delete decQuery[k];
    });

    if (Object.keys(decQuery).length > 0) {
      await User.findByIdAndUpdate(String(id), { $inc: decQuery });
    }
  }

  const adminId = req?.user?.sub || req?.user?.userId || req?.user?._id;
  const adminUsername = req?.user?.username || 'admin';
  const adminRole = req?.user?.role || 'admin';

  await writeAudit(req, 'admin.user.plan.instance.cancel', 'user_plan', sub._id.toString(), {
    targetUserId: String(id),
    userId: id,
    planId: sub.planId,
    adminId,
    adminUsername,
    adminRole,
  });
  await logUserActivity(req, 'admin.user.plan.instance.cancel', {
    planId: sub.planId,
    instanceId: sub._id.toString(),
    updatedByAdmin: true,
    adminId,
    adminUsername,
    adminRole,
  }, id);
  await deleteCachePattern('admin:users*');
  await deleteCachePattern(`user:${id}:plans*`);

  return { ok: true };
};

module.exports = {
  addPlan,
  cancelPlans,
  cancelPlanInstance,
};
