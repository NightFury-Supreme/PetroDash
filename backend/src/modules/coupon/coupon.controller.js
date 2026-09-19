/**
 * Coupon Controller
 */

const couponService = require('./coupon.service');
const { validateCouponSchema } = require('./coupon.schema');

class CouponController {
  async validateCoupon(req, res, _next) {
    try {
      const parsed = validateCouponSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      }

      const { code, planId } = parsed.data;
      const result = await couponService.validateCoupon(code, planId);
      
      return res.json(result);
    } catch (error) {
      const msgMap = {
        'PLAN_NOT_FOUND': { status: 404, message: 'Plan not found' },
        'INVALID_COUPON': { status: 404, message: 'Invalid coupon' },
        'COUPON_DISABLED': { status: 400, message: 'Coupon is disabled' },
        'COUPON_NOT_YET_VALID': { status: 400, message: 'Coupon not yet valid' },
        'COUPON_EXPIRED': { status: 400, message: 'Coupon expired' },
        'COUPON_LIMIT_REACHED': { status: 400, message: 'Coupon usage limit reached' },
        'COUPON_NOT_APPLICABLE_TO_PLAN': { status: 400, message: 'Coupon not applicable to this plan' },
        'INVALID_PLAN_PRICE': { status: 400, message: 'Invalid plan price' }
      };

      const knownError = msgMap[error.message];
      if (knownError) {
        return res.status(knownError.status).json({ error: knownError.message });
      }

      console.error('Coupon validation error:', error);
      res.status(500).json({ error: 'Failed to validate coupon' });
    }
  }
}

module.exports = new CouponController();
