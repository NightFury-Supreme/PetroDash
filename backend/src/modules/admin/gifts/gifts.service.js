/* ==========================================================================
   Admin Gifts Service
   Compliance: ISO/IEC 25010, ACID, Redis Caching, AppError Error Handling
========================================================================== */

const Gift = require('../../../models/Gift');
const GiftRedemption = require('../../../models/GiftRedemption');
const AppError = require('../../../utils/AppError');
const { getCache, setCache, deleteCachePattern } = require('../../../lib/redis');

const CACHE_TTL_SECONDS = 60;

class GiftsService {
  async listGifts({ search = '', tab = 'all', page = 1, limit = 10, sort = 'newest' }) {
    const cacheKey = `admin:gifts:list:${search}:${tab}:${page}:${limit}:${sort}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const filter = {};
    if (search.trim()) {
      filter.code = { $regex: search.trim(), $options: 'i' };
    }

    const now = new Date();
    if (tab === 'active') {
      filter.enabled = true;
      filter.$and = [
        { $or: [{ validUntil: null }, { validUntil: { $exists: false } }, { validUntil: { $gt: now } }] },
      ];
    } else if (tab === 'inactive') {
      filter.$or = [
        { enabled: false },
        { validUntil: { $lte: now } },
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'oldest' || sort === 'created_asc') sortObj = { createdAt: 1 };
    else if (sort === 'coins_desc') sortObj = { 'rewards.coins': -1, createdAt: -1 };
    else if (sort === 'coins_asc') sortObj = { 'rewards.coins': 1, createdAt: -1 };
    else if (sort === 'uses_desc') sortObj = { redeemedCount: -1, createdAt: -1 };
    else if (sort === 'uses_asc') sortObj = { redeemedCount: 1, createdAt: -1 };
    else if (sort === 'status_active') sortObj = { enabled: -1, createdAt: -1 };
    else if (sort === 'status_expired') sortObj = { validUntil: 1, createdAt: -1 };

    const total = await Gift.countDocuments(filter);
    const gifts = await Gift.find(filter)
      .select('-redemptions')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'username email profilePicture')
      .lean();

    const response = {
      gifts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };

    await setCache(cacheKey, response, CACHE_TTL_SECONDS);
    return response;
  }

  async getGiftById(id) {
    const cacheKey = `admin:gifts:detail:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const gift = await Gift.findById(id)
      .select('-redemptions')
      .populate('createdBy', 'username email profilePicture')
      .lean();

    if (!gift) {
      throw new AppError('Gift not found', 404, 'ERR_GIFT_NOT_FOUND');
    }

    await setCache(cacheKey, gift, CACHE_TTL_SECONDS);
    return gift;
  }

  async getGiftRedemptions(id, { page = 1, limit = 10 }) {
    const giftMeta = await Gift.findById(id).lean();
    if (!giftMeta) {
      throw new AppError('Gift not found', 404, 'ERR_GIFT_NOT_FOUND');
    }

    if (giftMeta.redemptions && Array.isArray(giftMeta.redemptions) && giftMeta.redemptions.length > 0) {
      try {
        const ops = giftMeta.redemptions.map((r) => ({
          updateOne: {
            filter: { gift: giftMeta._id, user: r.user },
            update: { $setOnInsert: { gift: giftMeta._id, user: r.user, redeemedAt: r.redeemedAt || new Date() } },
            upsert: true,
          },
        }));
        if (ops.length > 0) {
          await GiftRedemption.bulkWrite(ops, { ordered: false });
        }
        await Gift.updateOne({ _id: giftMeta._id }, { $unset: { redemptions: '' } });
      } catch (err) {
        console.error('Failed to migrate legacy redemptions:', err);
      }
    }

    const totalRedemptions = await GiftRedemption.countDocuments({ gift: id });

    const giftRedemptions = await GiftRedemption.find({ gift: id })
      .sort({ redeemedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'username email profilePicture')
      .lean();

    return {
      code: giftMeta.code,
      redemptions: giftRedemptions.map((r) => ({ user: r.user, redeemedAt: r.redeemedAt })),
      pagination: {
        page,
        limit,
        total: totalRedemptions,
        totalPages: Math.ceil(totalRedemptions / limit) || 1,
      },
    };
  }

  async createGift(data, userId) {
    const { code, description, rewards = {}, maxRedemptions, validFrom, validUntil, enabled } = data;

    if (!code || !code.trim()) {
      throw new AppError('Code is required', 400, 'ERR_GIFT_CODE_REQUIRED');
    }

    const normalizedCode = code.trim().toUpperCase();
    const exists = await Gift.findOne({ code: normalizedCode });
    if (exists) {
      throw new AppError('Code already exists', 409, 'ERR_GIFT_CODE_EXISTS');
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
        planIds: Array.isArray(rewards.planIds) ? rewards.planIds : [],
      },
      maxRedemptions: maxRedemptions ? Math.max(0, Math.min(1_000_000, parseInt(maxRedemptions, 10))) : 0,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      enabled: enabled !== undefined ? !!enabled : true,
      createdBy: userId,
      source: 'admin',
    });

    await gift.save();
    await deleteCachePattern('admin:gifts:*');
    return gift;
  }

  async updateGift(id, data) {
    const gift = await Gift.findById(id);
    if (!gift) {
      throw new AppError('Gift not found', 404, 'ERR_GIFT_NOT_FOUND');
    }

    const originalGift = gift.toObject();

    const { code, description, rewards, maxRedemptions, validFrom, validUntil, enabled } = data;
    if (code !== undefined) {
      const normalizedCode = code.trim().toUpperCase();
      if (normalizedCode !== gift.code) {
        const exists = await Gift.findOne({ code: normalizedCode, _id: { $ne: id } });
        if (exists) {
          throw new AppError('Code already exists', 409, 'ERR_GIFT_CODE_EXISTS');
        }
        gift.code = normalizedCode;
      }
    }
    if (description !== undefined) gift.description = description;
    if (maxRedemptions !== undefined) gift.maxRedemptions = Math.max(0, parseInt(maxRedemptions, 10));
    if (validFrom !== undefined) gift.validFrom = validFrom ? new Date(validFrom) : null;
    if (validUntil !== undefined) gift.validUntil = validUntil ? new Date(validUntil) : null;
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
      if (rewards.planIds) gift.rewards.planIds = rewards.planIds;
    }

    await gift.save();
    await deleteCachePattern('admin:gifts:*');

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

    return { gift, changes };
  }

  async deleteGift(id) {
    const gift = await Gift.findById(id);
    if (!gift) {
      throw new AppError('Gift not found', 404, 'ERR_GIFT_NOT_FOUND');
    }
    await Gift.findByIdAndDelete(id);
    await deleteCachePattern('admin:gifts:*');
    return gift;
  }
}

module.exports = new GiftsService();
