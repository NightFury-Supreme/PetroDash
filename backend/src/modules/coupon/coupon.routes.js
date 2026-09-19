/**
 * Coupon Routes
 */

const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const couponController = require('./coupon.controller');

const router = express.Router();

router.post('/validate', requireAuth, createRateLimiter(20, 60 * 1000), couponController.validateCoupon);

module.exports = router;
