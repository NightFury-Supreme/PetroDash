/**
 * Coupon Controller
 */

const couponService = require('./coupon.service');
const { validateCouponSchema } = require('./coupon.schema');
const AppError = require('../../utils/AppError');

class CouponController {
  async validateCoupon(req, res, next) {
    try {
      const parsed = validateCouponSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Invalid payload', 400, 'ERR_INVALID_PAYLOAD', parsed.error.flatten());
      }

      const { code, planId } = parsed.data;
      const result = await couponService.validateCoupon(code, planId);
      
      return res.json(result);
    } catch (error) {
      if (error instanceof AppError) return next(error);
      
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
        return next(new AppError(knownError.message, knownError.status, error.message));
      }

      console.error('Coupon validation error:', error);
      next(new AppError('Failed to validate coupon', 500, 'ERR_INTERNAL_SERVER'));
    }
  }
}

module.exports = new CouponController();
