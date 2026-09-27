/**
 * Coupon Service Layer
 */

const Coupon = require('../../models/Coupon');
const Plan = require('../../models/Plan');
const AppError = require('../../utils/AppError');

class CouponService {
  async validateCoupon(code, planId) {
    const plan = await Plan.findById(String(planId)).lean();
    if (!plan) throw AppError.notFound('Plan not found', 'ERR_PLAN_NOT_FOUND');

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
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

    const billingCycle = plan.lifetime ? 'lifetime' : 'monthly';
    const price = plan.billingOptions?.[billingCycle]?.price ?? (billingCycle === 'monthly' ? plan.pricePerMonth : plan.lifetimePrice);
    
    if (price === undefined || price === null) {
      throw AppError.badRequest('Invalid plan price', 'ERR_INVALID_PLAN_PRICE');
    }

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
