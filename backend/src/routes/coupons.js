const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const Plan = require('../models/Plan');
const { requireAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

// POST /api/coupons/validate
router.post('/validate', requireAuth, createRateLimiter(20, 60 * 1000), async (req, res) => {
  try {
    const { code, planId } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Coupon code is required' });
    }
    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    const plan = await Plan.findById(String(planId)).lean();
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ error: 'Invalid coupon' });
    if (!coupon.enabled) return res.status(400).json({ error: 'Coupon is disabled' });

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) return res.status(400).json({ error: 'Coupon not yet valid' });
    if (coupon.validUntil && now > coupon.validUntil) return res.status(400).json({ error: 'Coupon expired' });
    if (coupon.maxRedemptions && coupon.redeemedCount >= coupon.maxRedemptions) return res.status(400).json({ error: 'Coupon usage limit reached' });
    if (coupon.appliesToPlanIds && coupon.appliesToPlanIds.length > 0) {
      if (!coupon.appliesToPlanIds.map(String).includes(String(plan._id))) {
        return res.status(400).json({ error: 'Coupon not applicable to this plan' });
      }
    }

    // Calculate discount
    const billingCycle = plan.lifetime ? 'lifetime' : 'monthly';
    const price = plan.billingOptions?.[billingCycle]?.price ?? (billingCycle === 'monthly' ? plan.pricePerMonth : plan.lifetimePrice);
    
    if (price === undefined || price === null) {
      return res.status(400).json({ error: 'Invalid plan price' });
    }

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (price * coupon.value) / 100;
    } else {
      discountAmount = coupon.value;
    }

    const finalPrice = Math.max(0, price - discountAmount);

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      },
      originalPrice: price,
      discountAmount,
      finalPrice
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

module.exports = router;
