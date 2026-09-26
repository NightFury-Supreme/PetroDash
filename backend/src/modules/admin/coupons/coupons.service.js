/* ==========================================================================
   Admin Coupons Service
   Compliance: ISO/IEC 25010, ACID, Redis Caching, AppError Error Handling
========================================================================== */

const Coupon = require('../../../models/Coupon');
const AppError = require('../../../utils/AppError');
const { getCache, setCache, deleteCachePattern } = require('../../../lib/redis');

const CACHE_TTL_SECONDS = 60;

const parseDate = (d) => {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

class CouponsService {
  async listCoupons({ page = 1, limit = 10, search = '' }) {
    const skip = (page - 1) * limit;
    const cacheKey = `admin:coupons:list:${page}:${limit}:${search}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const query = {};
    if (search.trim()) {
      query.code = { $regex: search.trim(), $options: 'i' };
    }

    const [coupons, total] = await Promise.all([
      Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments(query),
    ]);

    const response = {
      coupons,
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

    const coupon = await Coupon.findById(id).lean();
    if (!coupon) {
      throw new AppError('Coupon not found', 404, 'ERR_COUPON_NOT_FOUND');
    }

    await setCache(cacheKey, coupon, CACHE_TTL_SECONDS);
    return coupon;
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
    const existingCoupon = await Coupon.findOne({ code: normalizedCode });
    if (existingCoupon) {
      throw new AppError('Coupon code already exists', 409, 'ERR_COUPON_CODE_EXISTS');
    }

    const coupon = new Coupon({
      code: normalizedCode,
      type,
      value: numValue,
      validFrom: parseDate(validFrom) || undefined,
      validUntil: parseDate(validUntil) || undefined,
      maxRedemptions: maxRedemptions ? Math.max(0, parseInt(maxRedemptions, 10)) : 0,
      appliesToPlanIds: Array.isArray(appliesToPlanIds) ? appliesToPlanIds : [],
      enabled: enabled !== undefined ? !!enabled : true,
      redeemedCount: 0,
    });

    await coupon.save();
    await deleteCachePattern('admin:coupons:*');
    return coupon;
  }

  async updateCoupon(id, data) {
    const { code, type, value, validFrom, validUntil, maxRedemptions, appliesToPlanIds, enabled } = data;

    const coupon = await Coupon.findById(id);
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
        const existingCoupon = await Coupon.findOne({ code: normalizedCode, _id: { $ne: id } });
        if (existingCoupon) {
          throw new AppError('Coupon code already exists', 409, 'ERR_COUPON_CODE_EXISTS');
        }
        coupon.code = normalizedCode;
      }
    }

    if (type !== undefined) coupon.type = type;
    if (validFrom !== undefined) coupon.validFrom = parseDate(validFrom);
    if (validUntil !== undefined) coupon.validUntil = parseDate(validUntil);
    if (maxRedemptions !== undefined) coupon.maxRedemptions = Math.max(0, parseInt(maxRedemptions, 10));
    if (appliesToPlanIds !== undefined) coupon.appliesToPlanIds = appliesToPlanIds;
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

    await deleteCachePattern('admin:coupons:*');
    return { coupon, changes };
  }

  async deleteCoupon(id) {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new AppError('Coupon not found', 404, 'ERR_COUPON_NOT_FOUND');
    }

    if (coupon.redeemedCount > 0) {
      throw new AppError('Cannot delete coupon: Coupon has already been redeemed by users', 400, 'ERR_COUPON_ALREADY_USED');
    }

    await Coupon.findByIdAndDelete(id);
    await deleteCachePattern('admin:coupons:*');
    return coupon;
  }
}

module.exports = new CouponsService();
