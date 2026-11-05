const Gift = require('../../../models/Gift');
const GiftRedemption = require('../../../models/GiftRedemption');
const AppError = require('../../../utils/AppError');
const { getCache, setCache } = require('../../../lib/redis');
const { buildIdFilter, formatPublicEntity, isValidPublicId } = require('../../../utils/publicId');
const giftsMutationService = require('./gifts.mutation.service');

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
        { $or: [{ validFrom: null }, { validFrom: { $exists: false } }, { validFrom: { $lte: now } }] },
      ];
    } else if (tab === 'inactive') {
      filter.$or = [
        { enabled: false },
        { validUntil: { $lte: now } },
        { validFrom: { $gt: now } },
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
      .populate('createdBy', 'username email profilePicture publicId')
      .populate('rewards.planIds', 'name publicId')
      .lean();

    const formattedGifts = gifts.map((g) => {
      const item = formatPublicEntity(g, 'gift');
      if (g.createdBy && typeof g.createdBy === 'object') {
        item.createdBy = formatPublicEntity(g.createdBy, 'user');
      }
      if (Array.isArray(g.rewards?.planIds)) {
        item.rewards.planIds = g.rewards.planIds
          .map((p) => (p && typeof p === 'object' && p.publicId ? p.publicId : (typeof p === 'string' && isValidPublicId(p, 'plan') ? p : null)))
          .filter(Boolean);
      }
      return item;
    });

    const response = {
      gifts: formattedGifts,
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

    const gift = await Gift.findOne(buildIdFilter(id))
      .select('-redemptions')
      .populate('createdBy', 'username email profilePicture publicId')
      .populate('rewards.planIds', 'name publicId')
      .lean();

    if (!gift) {
      throw new AppError('Gift not found', 404, 'ERR_GIFT_NOT_FOUND');
    }

    const formatted = formatPublicEntity(gift, 'gift');
    if (gift.createdBy && typeof gift.createdBy === 'object') {
      formatted.createdBy = formatPublicEntity(gift.createdBy, 'user');
    }
    if (Array.isArray(gift.rewards?.planIds)) {
      formatted.rewards.planIds = gift.rewards.planIds
        .map((p) => (p && typeof p === 'object' && p.publicId ? p.publicId : (typeof p === 'string' && isValidPublicId(p, 'plan') ? p : null)))
        .filter(Boolean);
    }

    await setCache(cacheKey, formatted, CACHE_TTL_SECONDS);
    return formatted;
  }

  async getGiftRedemptions(id, { page = 1, limit = 10 }) {
    const cacheKey = `admin:gifts:redemptions:${id}:${page}:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const giftMeta = await Gift.findOne(buildIdFilter(id)).select('_id code publicId').lean();
    if (!giftMeta) {
      throw new AppError('Gift not found', 404, 'ERR_GIFT_NOT_FOUND');
    }

    const [totalRedemptions, giftRedemptions] = await Promise.all([
      GiftRedemption.countDocuments({ gift: giftMeta._id }),
      GiftRedemption.find({ gift: giftMeta._id })
        .sort({ redeemedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'username email profilePicture publicId')
        .lean(),
    ]);

    const response = {
      code: giftMeta.code,
      redemptions: giftRedemptions.map((r) => ({
        user: r.user ? formatPublicEntity(r.user, 'user') : null,
        redeemedAt: r.redeemedAt,
      })),
      pagination: {
        page,
        limit,
        total: totalRedemptions,
        totalPages: Math.ceil(totalRedemptions / limit) || 1,
      },
    };

    await setCache(cacheKey, response, CACHE_TTL_SECONDS);
    return response;
  }

  async createGift(data, userId) {
    return giftsMutationService.createGift(data, userId);
  }

  async updateGift(id, data) {
    return giftsMutationService.updateGift(id, data);
  }

  async deleteGift(id) {
    return giftsMutationService.deleteGift(id);
  }

  async invalidateGiftCaches(publicId = null) {
    return giftsMutationService.invalidateGiftCaches(publicId);
  }
}

const giftsServiceInstance = new GiftsService();
giftsServiceInstance.GiftsService = GiftsService;
giftsServiceInstance.invalidateGiftCaches = giftsMutationService.invalidateGiftCaches;

module.exports = giftsServiceInstance;
