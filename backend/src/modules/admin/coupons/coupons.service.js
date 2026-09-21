const Coupon = require('../../../models/Coupon');
const AppError = require('../../../utils/AppError');
const { getCache, setCache, deleteCachePattern } = require('../../../lib/redis');

class CouponsService {
  async listCoupons({ page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const cacheKey = `admin:coupons:page:${page}:limit:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const [coupons, total] = await Promise.all([
      Coupon.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments({})
    ]);
    
    const response = {
      coupons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };

    await setCache(cacheKey, response, 30);
    return response;
  }

  async getCouponById(id) {
    const coupon = await Coupon.findById(id).lean();
    if (!coupon) throw new AppError('Coupon not found', 404);
    return coupon;
  }

  async createCoupon(data) {
    const { code, type, value, validFrom, validUntil, maxRedemptions, appliesToPlanIds, enabled } = data;

    if (!code || !type || value === undefined) {
      throw new AppError('Code, type, and value are required', 400);
    }

    if (!['percentage', 'fixed'].includes(type)) {
      throw new AppError('Type must be percentage or fixed', 400);
    }

    if (value <= 0) {
      throw new AppError('Value must be greater than 0', 400);
    }

    if (type === 'percentage' && value > 100) {
      throw new AppError('Percentage cannot exceed 100', 400);
    }

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      throw new AppError('Coupon code already exists', 400);
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      type,
      value,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      maxRedemptions: maxRedemptions ? parseInt(maxRedemptions) : undefined,
      appliesToPlanIds: appliesToPlanIds || [],
      enabled: enabled !== undefined ? enabled : true,
      redeemedCount: 0
    });

    await coupon.save();
    await deleteCachePattern('admin:coupons');
    return coupon;
  }

  async updateCoupon(id, data) {
    const { code, type, value, validFrom, validUntil, maxRedemptions, appliesToPlanIds, enabled } = data;

    const coupon = await Coupon.findById(id);
    if (!coupon) throw new AppError('Coupon not found', 404);
    
    const originalCoupon = coupon.toObject();

    if (type && !['percentage', 'fixed'].includes(type)) {
      throw new AppError('Type must be percentage or fixed', 400);
    }

    if (value !== undefined) {
      if (value <= 0) throw new AppError('Value must be greater than 0', 400);
      if (type === 'percentage' && value > 100) throw new AppError('Percentage cannot exceed 100', 400);
    }

    if (code && code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (existingCoupon) throw new AppError('Coupon code already exists', 400);
    }

    if (code !== undefined) coupon.code = code.toUpperCase();
    if (type !== undefined) coupon.type = type;
    if (value !== undefined) coupon.value = value;
    if (validFrom !== undefined) coupon.validFrom = validFrom ? new Date(validFrom) : undefined;
    if (validUntil !== undefined) coupon.validUntil = validUntil ? new Date(validUntil) : undefined;
    if (maxRedemptions !== undefined) coupon.maxRedemptions = maxRedemptions ? parseInt(maxRedemptions) : undefined;
    if (appliesToPlanIds !== undefined) coupon.appliesToPlanIds = appliesToPlanIds;
    if (enabled !== undefined) coupon.enabled = enabled;

    await coupon.save();
    
    const changes = {};
    const newCoupon = coupon.toObject();
    
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
    
    checkDiff(changes, data, originalCoupon, newCoupon);

    await deleteCachePattern('admin:coupons');
    return { coupon, changes };
  }

  async deleteCoupon(id) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new AppError('Coupon not found', 404);

    if (coupon.redeemedCount > 0) {
      throw new AppError('Cannot delete coupon: Coupon has already been used by users', 400);
    }

    await Coupon.findByIdAndDelete(id);
    await deleteCachePattern('admin:coupons');
    return coupon;
  }
}

module.exports = new CouponsService();
