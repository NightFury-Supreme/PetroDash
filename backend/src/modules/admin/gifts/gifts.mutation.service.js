const mongoose = require('mongoose');
const Gift = require('../../../models/Gift');
const GiftRedemption = require('../../../models/GiftRedemption');
const User = require('../../../models/User');
const Plan = require('../../../models/Plan');
const AppError = require('../../../utils/AppError');
const { deleteCache, deleteCachePattern, acquireLock, releaseLock } = require('../../../lib/redis');
const { buildIdFilter, formatPublicEntity } = require('../../../utils/publicId');

const invalidateGiftCaches = async (publicId = null) => {
  const ops = [
    deleteCache('admin:gifts:list::all:1:10:newest'),
    deleteCache('admin:gifts:list::all:1:20:newest'),
    deleteCache('admin:gifts:list::all:1:50:newest'),
    deleteCache('admin:gifts:list::active:1:10:newest'),
    deleteCache('admin:gifts:list::inactive:1:10:newest'),
    deleteCachePattern('admin:gifts:list:*'),
  ];
  if (publicId) {
    ops.push(deleteCache(`admin:gifts:detail:${publicId}`));
    ops.push(deleteCachePattern(`admin:gifts:redemptions:${publicId}:*`));
  }
  await Promise.allSettled(ops);
};

const parseDate = (d) => {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

class GiftsMutationService {
  async createGift(data, userId) {
    const { code, description, rewards = {}, maxRedemptions, validFrom, validUntil, enabled } = data;

    if (!code || !code.trim()) {
      throw new AppError('Code is required', 400, 'ERR_GIFT_CODE_REQUIRED');
    }

    const normalizedCode = code.trim().toUpperCase();
    const lockKey = `admin:gift:create:${normalizedCode}`;
    const lockToken = await acquireLock(lockKey, 5000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please wait', 'ERR_CONCURRENT_TRANSACTION');
    }

    try {
      const exists = await Gift.findOne({ code: normalizedCode }).select('_id').lean();
      if (exists) {
        throw new AppError('Code already exists', 409, 'ERR_GIFT_CODE_EXISTS');
      }

      let resolvedCreatorId = undefined;
      if (userId) {
        const userDoc = await User.findOne(buildIdFilter(userId)).select('_id').lean();
        if (userDoc) resolvedCreatorId = userDoc._id;
      }

      let resolvedPlanIds = [];
      if (Array.isArray(rewards.planIds) && rewards.planIds.length > 0) {
        const plans = await Plan.find(buildIdFilter(rewards.planIds)).select('_id').lean();
        resolvedPlanIds = plans.map((p) => p._id);
      }

      const gift = new Gift({
        code: normalizedCode,
        description: description || '',
        rewards: {
          coins: Math.min(1_000_000, Math.max(0, parseInt(rewards.coins || 0, 10))),
          resources: {
            diskMb: Math.min(1_000_000_000, Math.max(0, parseInt(rewards.resources?.diskMb || 0, 10))),
            memoryMb: Math.min(1_000_000_000, Math.max(0, parseInt(rewards.resources?.memoryMb || 0, 10))),
            cpuPercent: Math.min(1000, Math.max(0, parseInt(rewards.resources?.cpuPercent || 0, 10))),
            backups: Math.min(10_000, Math.max(0, parseInt(rewards.resources?.backups || 0, 10))),
            databases: Math.min(10_000, Math.max(0, parseInt(rewards.resources?.databases || 0, 10))),
            allocations: Math.min(10_000, Math.max(0, parseInt(rewards.resources?.allocations || 0, 10))),
            serverSlots: Math.min(10_000, Math.max(0, parseInt(rewards.resources?.serverSlots || 0, 10))),
          },
          planIds: resolvedPlanIds,
        },
        maxRedemptions: maxRedemptions ? Math.max(0, Math.min(1_000_000, parseInt(maxRedemptions, 10))) : 0,
        validFrom: parseDate(validFrom) || undefined,
        validUntil: parseDate(validUntil) || undefined,
        enabled: enabled !== undefined ? !!enabled : true,
        createdBy: resolvedCreatorId,
        source: 'admin',
      });

      await gift.save();
      await invalidateGiftCaches(gift.publicId);
      return formatPublicEntity(gift.toObject ? gift.toObject() : gift, 'gift');
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }

  async updateGift(id, data) {
    const lockKey = `admin:gift:mutation:${id}`;
    const lockToken = await acquireLock(lockKey, 5000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please wait', 'ERR_CONCURRENT_TRANSACTION');
    }

    try {
      const gift = await Gift.findOne(buildIdFilter(id));
      if (!gift) {
        throw new AppError('Gift not found', 404, 'ERR_GIFT_NOT_FOUND');
      }

      const originalGift = gift.toObject();

      const { code, description, rewards, maxRedemptions, validFrom, validUntil, enabled } = data;
      if (code !== undefined) {
        const normalizedCode = code.trim().toUpperCase();
        if (normalizedCode !== gift.code) {
          const exists = await Gift.findOne({ code: normalizedCode, _id: { $ne: gift._id } }).select('_id').lean();
          if (exists) {
            throw new AppError('Code already exists', 409, 'ERR_GIFT_CODE_EXISTS');
          }
          gift.code = normalizedCode;
        }
      }
      if (description !== undefined) gift.description = description;
      if (maxRedemptions !== undefined) gift.maxRedemptions = Math.max(0, parseInt(maxRedemptions, 10));
      if (validFrom !== undefined) gift.validFrom = parseDate(validFrom);
      if (validUntil !== undefined) gift.validUntil = parseDate(validUntil);
      if (enabled !== undefined) gift.enabled = !!enabled;

      if (rewards !== undefined) {
        if (!gift.rewards) gift.rewards = {};
        if (rewards.coins !== undefined) gift.rewards.coins = Math.max(0, parseInt(rewards.coins, 10));
        if (rewards.resources) {
          if (!gift.rewards.resources) gift.rewards.resources = {};
          for (const [rk, rv] of Object.entries(rewards.resources)) {
            gift.rewards.resources[rk] = Math.max(0, parseInt(rv || 0, 10));
          }
        }
        if (rewards.planIds !== undefined) {
          if (Array.isArray(rewards.planIds) && rewards.planIds.length > 0) {
            const plans = await Plan.find(buildIdFilter(rewards.planIds)).select('_id').lean();
            gift.rewards.planIds = plans.map((p) => p._id);
          } else {
            gift.rewards.planIds = [];
          }
        }
        gift.markModified('rewards');
      }

      await gift.save();
      await invalidateGiftCaches(gift.publicId);

      const newGift = gift.toObject();
      const changes = {};

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

      checkDiff(changes, data, originalGift, newGift);

      return { gift: formatPublicEntity(newGift, 'gift'), changes };
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }

  async deleteGift(id) {
    const lockKey = `admin:gift:mutation:${id}`;
    const lockToken = await acquireLock(lockKey, 5000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please wait', 'ERR_CONCURRENT_TRANSACTION');
    }

    try {
      const gift = await Gift.findOne(buildIdFilter(id));
      if (!gift) {
        throw new AppError('Gift not found', 404, 'ERR_GIFT_NOT_FOUND');
      }

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await GiftRedemption.deleteMany({ gift: gift._id }, { session });
          await Gift.deleteOne({ _id: gift._id }, { session });
        });
      } finally {
        await session.endSession();
      }

      await invalidateGiftCaches(gift.publicId);
      return formatPublicEntity(gift.toObject ? gift.toObject() : gift, 'gift');
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }
}

const giftsMutationServiceInstance = new GiftsMutationService();
giftsMutationServiceInstance.GiftsMutationService = GiftsMutationService;
giftsMutationServiceInstance.invalidateGiftCaches = invalidateGiftCaches;

module.exports = giftsMutationServiceInstance;
