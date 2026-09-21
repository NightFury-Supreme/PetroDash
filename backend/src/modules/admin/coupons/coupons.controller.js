const couponsService = require('./coupons.service');
const { writeAudit } = require('../../../middleware/audit');

class CouponsController {
  async listCoupons(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const response = await couponsService.listCoupons({ page, limit });
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
      const coupon = await couponsService.createCoupon(req.body);
      await writeAudit(req, 'admin.coupon.create', 'coupon', coupon._id.toString(), { created: req.body });
      res.status(201).json(coupon);
    } catch (error) {
      next(error);
    }
  }

  async updateCoupon(req, res, next) {
    try {
      const { coupon, changes } = await couponsService.updateCoupon(String(req.params.id), req.body);
      await writeAudit(req, 'admin.coupon.update', 'coupon', coupon._id.toString(), { changes: Object.keys(changes).length > 0 ? changes : undefined });
      res.json(coupon);
    } catch (error) {
      next(error);
    }
  }

  async deleteCoupon(req, res, next) {
    try {
      const coupon = await couponsService.deleteCoupon(String(req.params.id));
      await writeAudit(req, 'admin.coupon.delete', 'coupon', req.params.id, { code: coupon.code });
      res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CouponsController();
