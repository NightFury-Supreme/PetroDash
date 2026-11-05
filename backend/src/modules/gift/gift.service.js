const mongoose = require('mongoose');
const crypto = require('crypto');
const Gift = require('../../models/Gift');
const User = require('../../models/User');
const GiftRedemption = require('../../models/GiftRedemption');
const Plan = require('../../models/Plan');
const UserPlan = require('../../models/UserPlan');
const { acquireLock, releaseLock, getOrSetCache, deleteCache, deleteCachePattern } = require('../../lib/redis');
const { invalidateUserCaches } = require('../../utils/userCacheInvalidation');
const { calculateUserTotalResources } = require('../../utils/resourceCalculator');
const { formatPublicEntity, buildIdFilter } = require('../../utils/publicId');
const { invalidateGiftCaches } = require('../admin/gifts/gifts.service');
const AppError = require('../../utils/AppError');

async function invalidateUserMineGiftCaches(publicId) {
  if (!publicId) return;
  await Promise.allSettled([
    deleteCache(`gifts:mine:${publicId}`),
    deleteCache(`gifts:mine:${publicId}:1:10:all`),
    deleteCache(`gifts:mine:${publicId}:1:10:active`),
    deleteCache(`gifts:mine:${publicId}:1:10:inactive`),
    deleteCachePattern(`gifts:mine:${publicId}:*`),
  ]);
}

class GiftService {
  async createGift(userId, { coins, maxRedemptions, expiresInDays, description }) {
    const lockKey = `gift:create:${userId}`;
    const lockToken = await acquireLock(lockKey, 5000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please wait', 'ERR_CONCURRENT_TRANSACTION');
    }

    try {
      const userDoc = await User.findOne(buildIdFilter(userId)).select('_id publicId username').lean();
      if (!userDoc) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

      const totalCost = coins * maxRedemptions;

      const activeCount = await Gift.countDocuments({ createdBy: userDoc._id, source: 'user', enabled: true });
      if (activeCount >= 50) throw AppError.badRequest('Too many active codes', 'ERR_TOO_MANY_ACTIVE_CODES');

      let code = '';
      for (let i = 0; i < 5; i++) {
        const c = `G${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
        const exists = await Gift.exists({ code: c });
        if (!exists) { code = c; break; }
      }
      if (!code) throw AppError.internal('Failed to generate gift code', 'ERR_FAILED_TO_GENERATE_CODE');

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + expiresInDays);

      let gift;
      let user;
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          user = await User.findOneAndUpdate(
            { _id: userDoc._id, coins: { $gte: totalCost } },
            { $inc: { coins: -totalCost } },
            { new: true, session }
          );
          if (!user) {
            throw AppError.badRequest(
              `Insufficient coins. Creating a gift code for ${maxRedemptions} users with ${coins} coins requires ${totalCost} coins in total.`,
              'ERR_INSUFFICIENT_COINS',
              { total: totalCost, coins, users: maxRedemptions }
            );
          }

          const createdGifts = await Gift.create([{
            code,
            description: description || `Gift from ${user.username || 'User'}`,
            rewards: { coins, resources: {}, planIds: [] },
            maxRedemptions,
            validFrom: new Date(),
            validUntil,
            enabled: true,
            createdBy: userDoc._id,
            source: 'user'
          }], { session });

          gift = createdGifts[0];
        });
      } finally {
        await session.endSession();
      }

      await Promise.allSettled([
        invalidateUserCaches(userDoc.publicId),
        invalidateUserMineGiftCaches(userDoc.publicId),
        invalidateGiftCaches(),
      ]);

      return {
        gift: formatPublicEntity(gift.toObject ? gift.toObject() : gift, 'gift'),
        user: formatPublicEntity(user.toObject ? user.toObject() : user, 'user'),
        totalCost,
      };
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }

  async getUserGifts(userId, { paginate, page, pageSize, status }) {
    const isPaginated = paginate === 'true';
    const user = await User.findOne(buildIdFilter(userId)).select('_id publicId').lean();
    if (!user) return isPaginated ? { data: [], meta: { total: 0, page, pageSize, activeCount: 0, inactiveCount: 0 } } : [];

    const cacheKey = isPaginated ? `gifts:mine:${user.publicId}:${page}:${pageSize}:${status || 'all'}` : `gifts:mine:${user.publicId}`;

    return getOrSetCache(cacheKey, async () => {
      const now = new Date();
      const baseQuery = { createdBy: user._id };

      const activeCondition = {
        $and: [
          { enabled: true },
          { $or: [{ validUntil: { $exists: false } }, { validUntil: null }, { validUntil: { $gt: now } }] },
          { $or: [{ maxRedemptions: { $exists: false } }, { maxRedemptions: null }, { maxRedemptions: { $lte: 0 } }, { $expr: { $lt: [{ $ifNull: ["$redeemedCount", 0] }, "$maxRedemptions"] } }] }
        ]
      };

      const inactiveCondition = { $nor: [activeCondition] };

      let query = { ...baseQuery };
      if (status === 'active') query = { $and: [baseQuery, activeCondition] };
      else if (status === 'inactive') query = { $and: [baseQuery, inactiveCondition] };

      if (isPaginated) {
        const skip = (page - 1) * pageSize;
        const [gifts, total, activeCount, totalCount] = await Promise.all([
          Gift.find(query).select('publicId code description rewards maxRedemptions redeemedCount validFrom validUntil enabled createdAt').sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
          Gift.countDocuments(query),
          Gift.countDocuments({ $and: [baseQuery, activeCondition] }),
          Gift.countDocuments(baseQuery)
        ]);

        return { data: gifts.map((g) => formatPublicEntity(g)), meta: { total, page, pageSize, activeCount, inactiveCount: totalCount - activeCount } };
      }

      const gifts = await Gift.find(query).select('publicId code description rewards maxRedemptions redeemedCount validFrom validUntil enabled createdAt').sort({ createdAt: -1 }).lean();
      return gifts.map((g) => formatPublicEntity(g));
    }, 30);
  }

  async redeemGift(userId, code) {
    const userDoc = await User.findOne(buildIdFilter(userId)).select('_id publicId').lean();
    if (!userDoc) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const codeUpper = code.toUpperCase();

    const existingGift = await Gift.findOne({ code: codeUpper }).lean();
    if (!existingGift || !existingGift.enabled) throw AppError.notFound('Invalid or disabled gift code', 'ERR_GIFT_INVALID');

    const nowFast = new Date();
    if (existingGift.validFrom && nowFast < existingGift.validFrom) throw AppError.badRequest('Gift code not active yet', 'ERR_GIFT_NOT_ACTIVE');
    if (existingGift.validUntil && nowFast > existingGift.validUntil) throw AppError.badRequest('Gift code has expired', 'ERR_GIFT_EXPIRED');
    if (existingGift.maxRedemptions && existingGift.redeemedCount >= existingGift.maxRedemptions) throw AppError.badRequest('Gift code limit reached', 'ERR_GIFT_LIMIT_REACHED');

    const alreadyRedeemed = await GiftRedemption.exists({ gift: existingGift._id, user: userDoc._id });
    if (alreadyRedeemed) throw AppError.badRequest('You have already redeemed this gift code', 'ERR_GIFT_ALREADY_REDEEMED');

    const lockKey = `gift:redeem:${codeUpper}`;
    const lockToken = await acquireLock(lockKey, 3000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please wait', 'ERR_CONCURRENT_TRANSACTION');
    }

    try {
      let result;
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const now = new Date();
          const gift = await Gift.findOne({ code: codeUpper }).session(session);

          if (!gift || !gift.enabled) throw AppError.notFound('Invalid or disabled gift code', 'ERR_GIFT_INVALID');
          if (gift.validFrom && now < gift.validFrom) throw AppError.badRequest('Gift code not active yet', 'ERR_GIFT_NOT_ACTIVE');
          if (gift.validUntil && now > gift.validUntil) throw AppError.badRequest('Gift code has expired', 'ERR_GIFT_EXPIRED');
          if (gift.maxRedemptions && gift.redeemedCount >= gift.maxRedemptions) throw AppError.badRequest('Gift code limit reached', 'ERR_GIFT_LIMIT_REACHED');

          const isClaimed = await GiftRedemption.exists({ gift: gift._id, user: userDoc._id }).session(session);
          if (isClaimed) throw AppError.badRequest('You have already redeemed this gift code', 'ERR_GIFT_ALREADY_REDEEMED');

          const user = await User.findById(userDoc._id).session(session);
          if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

          const oldCoins = user.coins || 0;
          const oldResources = { ...(user.resources || {}) };
          const rewards = gift.rewards || {};
          const r = rewards.resources || {};

          if (typeof rewards.coins === 'number' && rewards.coins > 0) {
            user.coins = (user.coins || 0) + rewards.coins;
          }

          user.resources = user.resources || {};
          const resKeys = ['diskMb', 'memoryMb', 'cpuPercent', 'backups', 'databases', 'allocations', 'serverSlots'];
          resKeys.forEach(k => {
            user.resources[k] = (Number(user.resources[k]) || 0) + (Number(r[k]) || 0);
          });
          user.markModified('resources');

          const appliedPlans = [];
          const planIds = Array.isArray(rewards.planIds) ? rewards.planIds : [];
          if (planIds.length > 0) {
            for (const pid of planIds) {
              try {
                const plan = await Plan.findById(pid).session(session);
                if (!plan) continue;
                const now2 = new Date();
                let expiresAt = null;
                const isLifetime = !!plan.billingOptions?.lifetime;
                if (!isLifetime) {
                  expiresAt = new Date(now2);
                  expiresAt.setMonth(expiresAt.getMonth() + 1);
                }
                const sub = await UserPlan.create([{
                  userId: user._id,
                  planId: plan._id,
                  purchaseDate: now2,
                  expiresAt,
                  status: 'active',
                  billingCycle: isLifetime ? 'lifetime' : 'monthly',
                  amount: plan.pricePerMonth || 0,
                  resources: plan.productContent,
                  isRenewable: plan.billingOptions?.renewable || false,
                  isLifetime
                }], { session });

                const productContent = plan.productContent || {};
                user.coins = Number(user.coins || 0) + Number(productContent.coins || 0);

                appliedPlans.push({
                  planId: plan.publicId,
                  name: plan.name,
                  subscriptionId: sub[0].publicId,
                  lifetime: isLifetime,
                  expiresAt,
                });
              } catch (_planErr) {}
            }
          }

          await user.save({ session });

          const changes = {};
          if (user.coins !== oldCoins) changes.coins = { old: oldCoins, new: user.coins };
          resKeys.forEach(k => {
            if (user.resources[k] !== oldResources[k]) {
              changes[k] = { old: oldResources[k] || 0, new: user.resources[k] || 0 };
            }
          });

          gift.redeemedCount = (gift.redeemedCount || 0) + 1;
          await gift.save({ session });

          await GiftRedemption.create([{ gift: gift._id, user: user._id }], { session });

          const baseResources = { ...user.resources };
          const { totalResources } = await calculateUserTotalResources(user, { session });

          result = {
            description: gift.description,
            rewards: gift.rewards,
            user: { coins: user.coins, resources: totalResources, baseResources },
            appliedPlans,
            changes,
            codeUpper
          };
        });
      } finally {
        await session.endSession();
      }

      const creator = existingGift.createdBy
        ? await User.findById(existingGift.createdBy).select('publicId').lean()
        : null;

      await Promise.allSettled([
        invalidateUserCaches(userDoc.publicId),
        invalidateGiftCaches(existingGift.publicId),
        invalidateUserMineGiftCaches(userDoc.publicId),
        creator?.publicId ? invalidateUserMineGiftCaches(creator.publicId) : Promise.resolve(),
      ]);

      return result;
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }
}

module.exports = new GiftService();
