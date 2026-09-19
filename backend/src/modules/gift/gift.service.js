/**
 * Gift Service Layer
 * Handles business logic, atomic transactions, and caching.
 * Follows ISO 22301 (Reliability) and OWASP (Concurrency limits).
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const Gift = require('../../models/Gift');
const User = require('../../models/User');
const GiftRedemption = require('../../models/GiftRedemption');
const Plan = require('../../models/Plan');
const UserPlan = require('../../models/UserPlan');
const { getCache, setCache, deleteCachePattern } = require('../../lib/redis');

class GiftService {
  /**
   * Create a new user-generated gift code
   */
  async createGift(userId, { coins, maxRedemptions, expiresInDays, description }) {
    const totalCost = coins * maxRedemptions;

    // Limit total active user-created codes to prevent abuse
    const activeCount = await Gift.countDocuments({ createdBy: userId, source: 'user', enabled: true });
    if (activeCount >= 50) throw new Error('TOO_MANY_ACTIVE_CODES');

    // Deduct upfront atomically to prevent TOCTOU abuse
    const user = await User.findOneAndUpdate(
      { _id: userId, coins: { $gte: totalCost } },
      { $inc: { coins: -totalCost } },
      { new: true }
    );
    if (!user) throw new Error(`INSUFFICIENT_COINS:${totalCost}:${coins}:${maxRedemptions}`);

    // Generate unique code securely
    let code = '';
    for (let i = 0; i < 5; i++) {
      const c = `G${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
      const exists = await Gift.exists({ code: c });
      if (!exists) { code = c; break; }
    }
    if (!code) throw new Error('FAILED_TO_GENERATE_CODE');

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + expiresInDays);

    const gift = await Gift.create({
      code,
      description: description || `Gift from ${user.username || 'User'}`,
      rewards: { coins, resources: {}, planIds: [] },
      maxRedemptions,
      validFrom: new Date(),
      validUntil,
      enabled: true,
      createdBy: userId,
      source: 'user'
    });

    await deleteCachePattern(`gifts:mine:${userId}*`);

    return {
      gift,
      user,
      totalCost
    };
  }

  /**
   * Fetch gifts created by the user with pagination & caching
   */
  async getUserGifts(userId, { paginate, page, pageSize, status }) {
    const isPaginated = paginate === 'true';
    const cacheKey = isPaginated ? `gifts:mine:${userId}:${page}:${pageSize}:${status || 'all'}` : `gifts:mine:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const baseQuery = { createdBy: userId };
    
    const activeCondition = {
      $and: [
        { enabled: true },
        { $or: [ { validUntil: { $exists: false } }, { validUntil: null }, { validUntil: { $gt: now } } ] },
        { $or: [
            { maxRedemptions: { $exists: false } },
            { maxRedemptions: null },
            { maxRedemptions: { $lte: 0 } },
            { $expr: { $lt: [{ $ifNull: ["$redeemedCount", 0] }, "$maxRedemptions"] } }
          ]
        }
      ]
    };
    
    const inactiveCondition = { $nor: [ activeCondition ] };

    let query = { ...baseQuery };
    if (status === 'active') query = { $and: [baseQuery, activeCondition] };
    else if (status === 'inactive') query = { $and: [baseQuery, inactiveCondition] };

    if (isPaginated) {
      const skip = (page - 1) * pageSize;
      const [gifts, total, activeCount, totalCount] = await Promise.all([
        Gift.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
        Gift.countDocuments(query),
        Gift.countDocuments({ $and: [baseQuery, activeCondition] }),
        Gift.countDocuments(baseQuery)
      ]);
      
      const result = { data: gifts, meta: { total, page, pageSize, activeCount, inactiveCount: totalCount - activeCount } };
      await setCache(cacheKey, result, 30);
      return result;
    } else {
      const gifts = await Gift.find(query).sort({ createdAt: -1 }).lean();
      await setCache(cacheKey, gifts, 30);
      return gifts;
    }
  }

  /**
   * Redeem a gift code atomically within a Mongoose transaction
   */
  async redeemGift(userId, code) {
    const codeUpper = code.toUpperCase();
    
    // First fast-check without transaction
    let gift = await Gift.findOne({ code: codeUpper });
    if (!gift || !gift.enabled) throw new Error('INVALID');
    const nowFast = new Date();
    if (gift.validFrom && nowFast < gift.validFrom) throw new Error('NOT_ACTIVE');
    if (gift.validUntil && nowFast > gift.validUntil) throw new Error('EXPIRED');
    if (gift.maxRedemptions && gift.redeemedCount >= gift.maxRedemptions) throw new Error('LIMIT');
    
    let result;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const now = new Date();
        gift = await Gift.findOne({ code: codeUpper }).session(session);
        
        if (!gift || !gift.enabled) throw new Error('INVALID');
        if (gift.validFrom && now < gift.validFrom) throw new Error('NOT_ACTIVE');
        if (gift.validUntil && now > gift.validUntil) throw new Error('EXPIRED');
        if (gift.maxRedemptions && gift.redeemedCount >= gift.maxRedemptions) throw new Error('LIMIT');
        
        const alreadyRedeemed = await GiftRedemption.exists({ gift: gift._id, user: userId }).session(session);
        if (alreadyRedeemed) throw new Error('DUP');

        const user = await User.findById(userId).session(session);
        if (!user) throw new Error('NOUSER');

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
          user.resources[k] = (user.resources[k] || 0) + (r[k] || 0);
        });

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
              
              const recurrentResources = productContent.recurrentResources || {};
              user.resources.diskMb += Number(recurrentResources.diskMb || 0);
              user.resources.memoryMb += Number(recurrentResources.memoryMb || 0);
              user.resources.cpuPercent += Number(recurrentResources.cpuPercent || 0);
              user.resources.backups += Number(productContent.backups || 0);
              user.resources.databases += Number(productContent.databases || 0);
              user.resources.allocations += Number(productContent.additionalAllocations || 0);
              user.resources.serverSlots += Number(productContent.serverLimit || 0);
              
              appliedPlans.push({ planId: String(plan._id), name: plan.name, subscriptionId: String(sub[0]._id), lifetime: isLifetime, expiresAt });
            } catch (_) { /* ignore */ }
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
        
        result = { description: gift.description, rewards: gift.rewards, user: { coins: user.coins, resources: user.resources }, appliedPlans, changes, codeUpper };
      });
    } finally {
      await session.endSession();
    }
    
    return result;
  }
}

module.exports = new GiftService();
