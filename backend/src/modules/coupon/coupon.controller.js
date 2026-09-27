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
      return next(AppError.internal('Failed to validate coupon', 'ERR_INTERNAL_SERVER'));
    }
  }
}

module.exports = new CouponController();
