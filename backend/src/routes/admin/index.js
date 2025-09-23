const express = require('express');

const router = express.Router();

router.use('/eggs', require('./eggs'));
router.use('/locations', require('./locations'));
router.use('/users', require('./users'));
router.use('/servers', require('./servers'));
router.use('/shop', require('./shop'));
router.use('/stats', require('./stats'));
router.use('/plans', require('./plans'));
router.use('/tickets', require('./tickets'));
router.use('/coupons', require('./coupons'));
router.use('/gifts', require('./gifts'));
router.use('/logs', require('./logs'));
router.use('/settings', require('./settings'));
router.use('/email', require('./email'));
router.use('/payments', require('./payments'));

module.exports = router;
