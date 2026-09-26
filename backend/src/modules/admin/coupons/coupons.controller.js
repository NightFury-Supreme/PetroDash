/* ==========================================================================
   Admin Coupons Controller
   Compliance: ISO/IEC 25010, OWASP Input Validation, Audit Logging
========================================================================== */

const couponsService = require('./coupons.service');
const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');
const {
  createCouponSchema,
  updateCouponSchema,
  listCouponsQuerySchema,
} = require('./coupons.schema');

class CouponsController {
  async listCoupons(req, res, next) {
    try {
      const parsedQuery = listCouponsQuerySchema.parse(req.query);
      const response = await couponsService.listCoupons(parsedQuery);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getCoupon(req, res, next) {
    try {
      const coupon = await couponsService.getCouponById(String(req.params.id));
      res.json(coupon);
    } catch (error) {
      next(error);
    }
  }

  async createCoupon(req, res, next) {
    try {
      const parsedBody = createCouponSchema.parse(req.body);
      const coupon = await couponsService.createCoupon(parsedBody);
      await writeAudit(req, 'admin.coupon.create', 'coupon', coupon._id.toString(), { created: parsedBody });
      await logUserActivity(req, 'admin.coupon.create', { couponId: coupon._id.toString(), code: coupon.code });
      res.status(201).json(coupon);
    } catch (error) {
      next(error);
    }
  }

  async updateCoupon(req, res, next) {
    try {
      const parsedBody = updateCouponSchema.parse(req.body);
      const { coupon, changes } = await couponsService.updateCoupon(String(req.params.id), parsedBody);
      await writeAudit(req, 'admin.coupon.update', 'coupon', coupon._id.toString(), {
        changes: Object.keys(changes).length > 0 ? changes : undefined,
      });
      await logUserActivity(req, 'admin.coupon.update', {
        couponId: coupon._id.toString(),
        code: coupon.code,
        changes: Object.keys(changes).length > 0 ? changes : undefined,
      });
      res.json(coupon);
    } catch (error) {
      next(error);
    }
  }

  async deleteCoupon(req, res, next) {
    try {
      const coupon = await couponsService.deleteCoupon(String(req.params.id));
      await writeAudit(req, 'admin.coupon.delete', 'coupon', req.params.id, { code: coupon.code });
      await logUserActivity(req, 'admin.coupon.delete', { couponId: req.params.id, code: coupon.code });
      res.json({ success: true, code: 'COUPON_DELETED' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CouponsController();
