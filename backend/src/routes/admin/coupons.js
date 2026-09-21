const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const couponsController = require('../../modules/admin/coupons/coupons.controller');

const router = express.Router();

router.get('/', requireAdmin, couponsController.listCoupons);
router.get('/:id', requireAdmin, couponsController.getCoupon);
router.post('/', requireAdmin, couponsController.createCoupon);
router.patch('/:id', requireAdmin, couponsController.updateCoupon);
router.delete('/:id', requireAdmin, couponsController.deleteCoupon);

module.exports = router;
