/**
 * Coupon Service Layer
 */

const Coupon = require('../../models/Coupon');
const Plan = require('../../models/Plan');

class CouponService {
  async validateCoupon(code, planId) {
    const plan = await Plan.findById(String(planId)).lean();
    if (!plan) throw new Error('PLAN_NOT_FOUND');

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) throw new Error('INVALID_COUPON');
    if (!coupon.enabled) throw new Error('COUPON_DISABLED');

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) throw new Error('COUPON_NOT_YET_VALID');
    if (coupon.validUntil && now > coupon.validUntil) throw new Error('COUPON_EXPIRED');
    if (coupon.maxRedemptions && coupon.redeemedCount >= coupon.maxRedemptions) throw new Error('COUPON_LIMIT_REACHED');
    
    if (coupon.appliesToPlanIds && coupon.appliesToPlanIds.length > 0) {
      if (!coupon.appliesToPlanIds.map(String).includes(String(plan._id))) {
        throw new Error('COUPON_NOT_APPLICABLE_TO_PLAN');
      }
    }

    const billingCycle = plan.lifetime ? 'lifetime' : 'monthly';
    const price = plan.billingOptions?.[billingCycle]?.price ?? (billingCycle === 'monthly' ? plan.pricePerMonth : plan.lifetimePrice);
    
    if (price === undefined || price === null) {
      throw new Error('INVALID_PLAN_PRICE');
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
