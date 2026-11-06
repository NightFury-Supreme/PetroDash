const mongoose = require('mongoose');
const Coupon = require('../../../models/Coupon');
const Plan = require('../../../models/Plan');
const AppError = require('../../../utils/AppError');
const { getCache, setCache, deleteCache, deleteCachePattern, acquireLock, releaseLock } = require('../../../lib/redis');
const { buildIdFilter, formatPublicEntity, isValidPublicId } = require('../../../utils/publicId');

const CACHE_TTL_SECONDS = 60;

const invalidateCouponCaches = async (publicId = null) => {
  const ops = [
    deleteCachePattern('admin:coupons:list:*'),
  ];
  if (publicId) ops.push(deleteCache(`admin:coupons:detail:${publicId}`));
  await Promise.all(ops);
};

const parseDate = (d) => {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

class CouponsService {
  async listCoupons({ page = 1, limit = 10, search = '', status = 'all', type = 'all', sort = 'newest' }) {
    const skip = (page - 1) * limit;
    const cacheKey = `admin:coupons:list:${page}:${limit}:${search}:${status}:${type}:${sort}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const query = {};
    if (search.trim()) {
      query.code = { $regex: search.trim(), $options: 'i' };
    }

    const now = new Date();
    if (status === 'active') {
      query.enabled = true;
      query.$or = [{ validUntil: null }, { validUntil: { $gte: now } }];
    } else if (status === 'disabled') {
      query.enabled = false;
    } else if (status === 'expired') {
      query.validUntil = { $lt: now };
    }

    if (type === 'percentage') {
      query.type = 'percentage';
    } else if (type === 'fixed') {
      query.type = 'fixed';
    }

    let sortCriteria = { createdAt: -1 };
    if (sort === 'oldest') {
      sortCriteria = { createdAt: 1 };
    } else if (sort === 'value_desc') {
      sortCriteria = { value: -1 };
    } else if (sort === 'value_asc') {
      sortCriteria = { value: 1 };
    } else if (sort === 'redemptions_desc') {
      sortCriteria = { redeemedCount: -1, createdAt: -1 };
    }

    const [coupons, total] = await Promise.all([
      Coupon.find(query).populate('appliesToPlanIds', 'publicId').sort(sortCriteria).skip(skip).limit(limit).lean(),
      Coupon.countDocuments(query),
    ]);

    const mappedCoupons = coupons.map((c) => {
      const cleanCoupon = formatPublicEntity(c, 'coupon');
      if (Array.isArray(c.appliesToPlanIds)) {
        cleanCoupon.appliesToPlanIds = c.appliesToPlanIds
          .map((p) => (p && typeof p === 'object' && p.publicId ? p.publicId : (typeof p === 'string' && isValidPublicId(p, 'plan') ? p : null)))
          .filter(Boolean);
      }
      return cleanCoupon;
    });

    const response = {
      coupons: mappedCoupons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };

    await setCache(cacheKey, response, CACHE_TTL_SECONDS);
    return response;
  }

  async getCouponById(id) {
    const cacheKey = `admin:coupons:detail:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const coupon = await Coupon.findOne(buildIdFilter(id)).populate('appliesToPlanIds', 'publicId').lean();
    if (!coupon) {
      throw new AppError('Coupon not found', 404, 'ERR_COUPON_NOT_FOUND');
    }

    const formatted = formatPublicEntity(coupon, 'coupon');
    if (Array.isArray(coupon.appliesToPlanIds)) {
      formatted.appliesToPlanIds = coupon.appliesToPlanIds
        .map((p) => (p && typeof p === 'object' && p.publicId ? p.publicId : (typeof p === 'string' && isValidPublicId(p, 'plan') ? p : null)))
        .filter(Boolean);
    }
    await setCache(cacheKey, formatted, CACHE_TTL_SECONDS);
    return formatted;
  }

  async createCoupon(data) {
    const { code, type, value, validFrom, validUntil, maxRedemptions, appliesToPlanIds, enabled } = data;

    if (!code || !code.trim()) {
      throw new AppError('Coupon code is required', 400, 'ERR_COUPON_CODE_REQUIRED');
    }

    if (!['percentage', 'fixed'].includes(type)) {
      throw new AppError('Type must be percentage or fixed', 400, 'ERR_COUPON_TYPE_INVALID');
    }

    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      throw new AppError('Value must be greater than 0', 400, 'ERR_COUPON_VALUE_INVALID');
    }

    if (type === 'percentage' && numValue > 100) {
      throw new AppError('Percentage cannot exceed 100', 400, 'ERR_COUPON_PERCENTAGE_EXCEEDED');
    }

    const normalizedCode = code.trim().toUpperCase();
    const existingCoupon = await Coupon.findOne({ code: normalizedCode }).select('_id').lean();
    if (existingCoupon) {
      throw new AppError('Coupon code already exists', 409, 'ERR_COUPON_CODE_EXISTS');
    }

    let resolvedPlanIds = [];
    if (Array.isArray(appliesToPlanIds) && appliesToPlanIds.length > 0) {
      const plans = await Plan.find(buildIdFilter(appliesToPlanIds)).select('_id').lean();
      resolvedPlanIds = plans.map((p) => p._id);
    }

    const coupon = new Coupon({
      code: normalizedCode,
      type,
      value: numValue,
      validFrom: parseDate(validFrom) || undefined,
      validUntil: parseDate(validUntil) || undefined,
      maxRedemptions: maxRedemptions ? Math.max(0, parseInt(maxRedemptions, 10)) : 0,
      appliesToPlanIds: resolvedPlanIds,
      enabled: enabled !== undefined ? !!enabled : true,
      redeemedCount: 0,
    });

    await coupon.save();
    await invalidateCouponCaches(coupon.publicId);
    await coupon.populate('appliesToPlanIds', 'publicId');
    const formatted = formatPublicEntity(coupon.toObject(), 'coupon');
    if (Array.isArray(coupon.appliesToPlanIds)) {
      formatted.appliesToPlanIds = coupon.appliesToPlanIds
        .map((p) => (p && typeof p === 'object' && p.publicId ? p.publicId : (typeof p === 'string' && isValidPublicId(p, 'plan') ? p : null)))
        .filter(Boolean);
    }
    return formatted;
  }

  async updateCoupon(id, data) {
    const lockKey = `admin:coupons:lock:${id}`;
    const lockToken = await acquireLock(lockKey, 3000);
    if (!lockToken) {
      throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');
    }

    try {
      const { code, type, value, validFrom, validUntil, maxRedemptions, appliesToPlanIds, enabled } = data;

      const coupon = await Coupon.findOne(buildIdFilter(id));
      if (!coupon) {
        throw new AppError('Coupon not found', 404, 'ERR_COUPON_NOT_FOUND');
      }

      const originalCoupon = coupon.toObject();

      if (type && !['percentage', 'fixed'].includes(type)) {
        throw new AppError('Type must be percentage or fixed', 400, 'ERR_COUPON_TYPE_INVALID');
      }

      if (value !== undefined) {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue <= 0) {
          throw new AppError('Value must be greater than 0', 400, 'ERR_COUPON_VALUE_INVALID');
        }
        const effectiveType = type || coupon.type;
        if (effectiveType === 'percentage' && numValue > 100) {
          throw new AppError('Percentage cannot exceed 100', 400, 'ERR_COUPON_PERCENTAGE_EXCEEDED');
        }
        coupon.value = numValue;
      }

      if (code !== undefined) {
        const normalizedCode = code.trim().toUpperCase();
        if (normalizedCode !== coupon.code) {
          const exists = await Coupon.findOne({ code: normalizedCode, _id: { $ne: coupon._id } }).select('_id').lean();
          if (exists) {
            throw new AppError('Coupon code already exists', 409, 'ERR_COUPON_CODE_EXISTS');
          }
          coupon.code = normalizedCode;
        }
      }

      if (type !== undefined) coupon.type = type;
      if (validFrom !== undefined) coupon.validFrom = parseDate(validFrom);
      if (validUntil !== undefined) coupon.validUntil = parseDate(validUntil);
      if (maxRedemptions !== undefined) coupon.maxRedemptions = Math.max(0, parseInt(maxRedemptions, 10));
      if (appliesToPlanIds !== undefined) {
        if (Array.isArray(appliesToPlanIds) && appliesToPlanIds.length > 0) {
          const plans = await Plan.find(buildIdFilter(appliesToPlanIds)).select('_id').lean();
          coupon.appliesToPlanIds = plans.map((p) => p._id);
        } else {
          coupon.appliesToPlanIds = [];
        }
      }
      if (enabled !== undefined) coupon.enabled = !!enabled;

      await coupon.save();

      const changes = {};
      const newCoupon = coupon.toObject();

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

      checkDiff(changes, data, originalCoupon, newCoupon);

      await invalidateCouponCaches(coupon.publicId);
      await coupon.populate('appliesToPlanIds', 'publicId');
      const cleanUpdated = formatPublicEntity(coupon.toObject(), 'coupon');
      if (Array.isArray(coupon.appliesToPlanIds)) {
        cleanUpdated.appliesToPlanIds = coupon.appliesToPlanIds
          .map((p) => (p && typeof p === 'object' && p.publicId ? p.publicId : (typeof p === 'string' && isValidPublicId(p, 'plan') ? p : null)))
          .filter(Boolean);
      }
      return { coupon: cleanUpdated, changes };
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }

  async deleteCoupon(id) {
    const lockKey = `admin:coupons:lock:${id}`;
    const lockToken = await acquireLock(lockKey, 3000);
    if (!lockToken) {
      throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');
    }

    try {
      const coupon = await Coupon.findOne(buildIdFilter(id));
      if (!coupon) {
        throw new AppError('Coupon not found', 404, 'ERR_COUPON_NOT_FOUND');
      }

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const liveCoupon = await Coupon.findById(coupon._id).session(session);
          if (!liveCoupon) {
            throw new AppError('Coupon not found', 404, 'ERR_COUPON_NOT_FOUND');
          }
          if (liveCoupon.redeemedCount > 0) {
            throw new AppError('Cannot delete coupon: Coupon has already been redeemed by users', 400, 'ERR_COUPON_ALREADY_USED');
          }
          await Coupon.findByIdAndDelete(coupon._id, { session });
        });
      } finally {
        await session.endSession();
      }

      await invalidateCouponCaches(coupon.publicId);
      return formatPublicEntity(coupon.toObject(), 'coupon');
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }
}

module.exports = new CouponsService();
