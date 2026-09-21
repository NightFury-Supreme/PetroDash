const Gift = require('../../../models/Gift');
const GiftRedemption = require('../../../models/GiftRedemption');
const AppError = require('../../../utils/AppError');

class GiftsService {
  async listGifts({ search = '', tab = 'all', page = 1, limit = 10, sort = 'newest' }) {
    let filter = {};
    if (search.trim()) {
      filter.code = { $regex: search.trim(), $options: 'i' };
    }

    if (tab === 'active') {
      filter.enabled = true;
      filter.$and = [
        { $or: [{ validUntil: null }, { validUntil: { $exists: false } }, { validUntil: { $gt: new Date() } }] },
      ];
    } else if (tab === 'inactive') {
      filter.$or = [
        { enabled: false },
        { validUntil: { $lte: new Date() } }
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'oldest') {
      sortObj = { createdAt: 1 };
    }

    const total = await Gift.countDocuments(filter);
    const gifts = await Gift.find(filter)
      .select('-redemptions')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'username email profilePicture')
      .lean();

    return {
      gifts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getGiftById(id) {
    const gift = await Gift.findById(id)
      .select('-redemptions')
      .populate('createdBy', 'username email profilePicture')
      .lean();
    if (!gift) {
      throw new AppError('Gift not found', 404);
    }
    return gift;
  }

  async getGiftRedemptions(id, { page = 1, limit = 10 }) {
    const giftMeta = await Gift.findById(id).lean();
    if (!giftMeta) {
      throw new AppError('Gift not found', 404);
    }

    if (giftMeta.redemptions && Array.isArray(giftMeta.redemptions) && giftMeta.redemptions.length > 0) {
      try {
        const ops = giftMeta.redemptions.map(r => ({
          updateOne: {
            filter: { gift: giftMeta._id, user: r.user },
            update: { $setOnInsert: { gift: giftMeta._id, user: r.user, redeemedAt: r.redeemedAt || new Date() } },
            upsert: true
          }
        }));
        if (ops.length > 0) {
          await GiftRedemption.bulkWrite(ops, { ordered: false });
        }
        await Gift.updateOne({ _id: giftMeta._id }, { $unset: { redemptions: "" } });
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
      redemptions: giftRedemptions.map(r => ({ user: r.user, redeemedAt: r.redeemedAt })),
      pagination: {
        page,
        limit,
        total: totalRedemptions,
        totalPages: Math.ceil(totalRedemptions / limit) || 1
      }
    };
  }

  async createGift(data, userId) {
    const { code, description, rewards = {}, maxRedemptions, validFrom, validUntil, enabled } = data;

    if (!code) throw new AppError('Code is required', 400);

    const exists = await Gift.findOne({ code: code.toUpperCase() });
    if (exists) throw new AppError('Code already exists', 400);

    const gift = new Gift({
      code: code.toUpperCase(),
      description: description || '',
      rewards: {
        coins: Math.min(1_000_000, Math.max(0, parseInt(rewards.coins || 0))),
        resources: {
          diskMb: Math.min(1_000_000_000, Math.max(0, parseInt(rewards.resources?.diskMb || 0))),
          memoryMb: Math.min(1_000_000_000, Math.max(0, parseInt(rewards.resources?.memoryMb || 0))),
          cpuPercent: Math.min(1000, Math.max(0, parseInt(rewards.resources?.cpuPercent || 0))),
          backups: Math.min(10_000, Math.max(0, parseInt(rewards.resources?.backups || 0))),
          databases: Math.min(10_000, Math.max(0, parseInt(rewards.resources?.databases || 0))),
          allocations: Math.min(10_000, Math.max(0, parseInt(rewards.resources?.allocations || 0))),
          serverSlots: Math.min(10_000, Math.max(0, parseInt(rewards.resources?.serverSlots || 0))),
        },
        planIds: Array.isArray(rewards.planIds) ? rewards.planIds : [],
      },
      maxRedemptions: maxRedemptions ? Math.max(0, Math.min(1_000_000, parseInt(maxRedemptions))) : 0,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      enabled: enabled !== undefined ? !!enabled : true,
      createdBy: userId,
      source: 'admin'
    });

    await gift.save();
    return gift;
  }

  async updateGift(id, data) {
    const gift = await Gift.findById(id);
    if (!gift) throw new AppError('Gift not found', 404);
    
    const originalGift = gift.toObject();

    const { code, description, rewards, maxRedemptions, validFrom, validUntil, enabled } = data;
    if (code !== undefined) gift.code = code.toUpperCase();
    if (description !== undefined) gift.description = description;
    if (maxRedemptions !== undefined) gift.maxRedemptions = Math.max(0, parseInt(maxRedemptions));
    if (validFrom !== undefined) gift.validFrom = validFrom ? new Date(validFrom) : null;
    if (validUntil !== undefined) gift.validUntil = validUntil ? new Date(validUntil) : null;
    if (enabled !== undefined) gift.enabled = !!enabled;
    
    if (rewards !== undefined) {
      if (!gift.rewards) gift.rewards = {};
      if (rewards.coins !== undefined) gift.rewards.coins = Math.max(0, parseInt(rewards.coins));
      if (rewards.resources) {
        if (!gift.rewards.resources) gift.rewards.resources = {};
        for (const [rk, rv] of Object.entries(rewards.resources)) {
          gift.rewards.resources[rk] = Math.max(0, parseInt(rv || 0));
        }
      }
      if (rewards.planIds) gift.rewards.planIds = rewards.planIds;
    }

    await gift.save();

    const newGift = gift.toObject();
    const changes = {};

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
    
    checkDiff(changes, data, originalGift, newGift);

    return { gift, changes };
  }

  async deleteGift(id) {
    const gift = await Gift.findById(id);
    if (!gift) throw new AppError('Gift not found', 404);
    await Gift.findByIdAndDelete(id);
    return gift;
  }
}

module.exports = new GiftsService();
