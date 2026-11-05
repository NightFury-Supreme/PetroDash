const Coupon = require('../../models/Coupon');
const Plan = require('../../models/Plan');
const AppError = require('../../utils/AppError');
const { buildIdFilter } = require('../../utils/publicId');

class CouponService {
  async validateCoupon(code, planId) {
    const plan = await Plan.findOne(buildIdFilter(planId)).lean();
    if (!plan) throw AppError.notFound('Plan not found', 'ERR_PLAN_NOT_FOUND');

    const cleanCode = String(code || '').toUpperCase().trim();
    const coupon = await Coupon.findOne({ code: { $eq: cleanCode } }).lean();
    if (!coupon) throw AppError.notFound('Invalid coupon', 'ERR_COUPON_INVALID');
    if (!coupon.enabled) throw AppError.badRequest('Coupon is disabled', 'ERR_COUPON_DISABLED');

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) throw AppError.badRequest('Coupon not yet valid', 'ERR_COUPON_NOT_YET_VALID');
    if (coupon.validUntil && now > coupon.validUntil) throw AppError.badRequest('Coupon expired', 'ERR_COUPON_EXPIRED');
    if (coupon.maxRedemptions && coupon.redeemedCount >= coupon.maxRedemptions) throw AppError.badRequest('Coupon usage limit reached', 'ERR_COUPON_LIMIT_REACHED');
    
    if (coupon.appliesToPlanIds && coupon.appliesToPlanIds.length > 0) {
      if (!coupon.appliesToPlanIds.map(String).includes(String(plan._id))) {
        throw AppError.badRequest('Coupon not applicable to this plan', 'ERR_COUPON_NOT_APPLICABLE');
      }
    }

    const price = Number(plan.pricePerMonth || 0);

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (price * coupon.value) / 100;
    } else {
      discountAmount = coupon.value;
    }

    const finalPrice = Math.max(0, price - discountAmount);

    return {
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      },
      originalPrice: price,
      discountAmount,
      finalPrice
    };
  }
}

module.exports = new CouponService();
