const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Plan = require('../models/Plan');
const UserPlan = require('../models/UserPlan');
const Coupon = require('../models/Coupon');
const { writeAudit } = require('../middleware/audit');

const router = express.Router();

// GET /api/plans - list all public plans
router.get('/', async(req, res) => {
  try {
    const now = new Date();
    const plansQuery = Plan.find({
      visibility: 'public',
      $and: [
        {
          $or: [{ availableAt: { $lte: now } }, { availableAt: { $exists: false } }]
        },
        {
          $or: [{ availableUntil: { $gt: now } }, { availableUntil: { $exists: false } }]
        },
        {
          $or: [{ stock: { $gt: 0 } }, { stock: 0 }]
        }
      ]
    })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    // Optional pagination
    const paginate = String(req.query.paginate || '').toLowerCase() === 'true';
    const page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize || '12')) || 12));
    let plansRaw;
    if (paginate) {
      const [list, total] = await Promise.all([
        plansQuery.skip((page - 1) * pageSize).limit(pageSize),
        Plan.countDocuments({ visibility: 'public' })
      ]);
      plansRaw = list;
      // sanitize below; respond with meta
      const plans = plansRaw.map(p => {
        const {
          staffNotes,
          totalPurchases,
          currentUsers,
          stock,
          limitPerCustomer,
          redirectionLink,
          billingOptions,
          ...rest
        } = p;
        return { ...rest, lifetime: Boolean(billingOptions?.lifetime) };
      });
      return res.json({ data: plans, meta: { total, page, pageSize } });
    } else {
      plansRaw = await plansQuery;
    }

    // Sanitize public response: remove staff-only fields and flatten billingOptions.lifetime
    const plans = plansRaw.map(p => {
      const {
        staffNotes,
        totalPurchases,
        currentUsers,
        stock,
        limitPerCustomer,
        redirectionLink,
        billingOptions,
        ...rest
      } = p;
      return {
        ...rest,
        lifetime: Boolean(billingOptions?.lifetime)
      };
    });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// POST /api/plans/purchase - purchase a plan
router.post('/purchase', requireAuth, async(req, res) => {
  try {
    const { planId, couponCode, billingCycle } = req.body;

    if (!planId || !billingCycle) {
      return res.status(400).json({ error: 'Plan ID and billing cycle are required' });
    }

    // Validate billing cycle
    if (!['monthly', 'quarterly', 'semi-annual', 'annual', 'lifetime'].includes(billingCycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(planId)) {
      return res.status(400).json({ error: 'Invalid plan ID format' });
    }

    // Get plan
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Check availability
    const now = new Date();
    if (plan.availableAt && now < plan.availableAt) {
      return res.status(400).json({ error: 'Plan not yet available' });
    }
    if (plan.availableUntil && now > plan.availableUntil) {
      return res.status(400).json({ error: 'Plan no longer available' });
    }

    // Check stock
    if (plan.stock === -1) {
      return res.status(400).json({ error: 'Plan is unavailable' });
    }
    if (plan.stock > 0) {
      const purchasedCount = await UserPlan.countDocuments({
        planId: { $eq: planId },
        status: { $eq: 'active' }
      });
      if (purchasedCount >= plan.stock) {
        return res.status(400).json({ error: 'Plan is out of stock' });
      }
    }

    // Check customer limit
    if (plan.limitPerCustomer > 0) {
      const userPurchases = await UserPlan.countDocuments({
        userId: { $eq: req.user.sub },
        planId: { $eq: planId },
        status: { $eq: 'active' }
      });
      if (userPurchases >= plan.limitPerCustomer) {
        return res.status(400).json({ error: 'You have reached the purchase limit for this plan' });
      }
    }

    // Validate billing cycle availability
    if (plan.billingOptions?.lifetime) {
      // For lifetime plans, billing cycle should be 'lifetime'
      if (billingCycle !== 'lifetime') {
        return res.status(400).json({ error: 'Lifetime plans use lifetime billing cycle' });
      }
    } else {
      // For regular plans, check if billing cycle is available
      if (plan.availableBillingCycles && !plan.availableBillingCycles.includes(billingCycle)) {
        return res.status(400).json({ error: 'Billing cycle not available for this plan' });
      }
    }

    // Process coupon if provided
    let discountAmount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        enabled: true
      });

      if (!coupon) {
        return res.status(400).json({ error: 'Invalid coupon code' });
      }

      // Check coupon validity
      if (coupon.validFrom && now < coupon.validFrom) {
        return res.status(400).json({ error: 'Coupon not yet valid' });
      }
      if (coupon.validUntil && now > coupon.validUntil) {
        return res.status(400).json({ error: 'Coupon expired' });
      }
      if (coupon.maxRedemptions && coupon.redeemedCount >= coupon.maxRedemptions) {
        return res.status(400).json({ error: 'Coupon usage limit reached' });
      }
      if (
        coupon.appliesToPlanIds?.length &&
        !coupon.appliesToPlanIds.map(String).includes(String(plan._id))
      ) {
        return res.status(400).json({ error: 'Coupon not applicable to this plan' });
      }

      // Calculate discount
      if (coupon.type === 'percentage') {
        discountAmount = (plan.pricePerMonth * coupon.value) / 100;
      } else {
        discountAmount = coupon.value;
      }
    }

    // Calculate final price
    let finalPrice = plan.pricePerMonth;
    if (billingCycle === 'quarterly') {
      finalPrice = plan.pricePerMonth * 3;
    } else if (billingCycle === 'semi-annual') {
      finalPrice = plan.pricePerMonth * 6;
    } else if (billingCycle === 'annual') {
      finalPrice = plan.pricePerMonth * 12; // Use monthly price * 12 instead of yearly price
    }

    finalPrice = Math.max(0, finalPrice - discountAmount);

    // Store purchase intent for PayPal
    const purchaseIntent = {
      userId: req.user.sub,
      planId: plan._id,
      billingCycle,
      amount: finalPrice,
      couponCode: coupon?.code,
      discountAmount,
      planName: plan.name,
      isLifetime: plan.billingOptions.lifetime
    };

    // Store in session or temporary storage (for now, we'll use a simple approach)
    // In production, you might want to use Redis or database for this
    req.session = req.session || {};
    req.session.pendingPurchase = purchaseIntent;

    // Redirect to PayPal
    res.json({
      success: true,
      redirectToPayPal: true,
      message: 'Redirecting to PayPal for payment',
      purchaseData: purchaseIntent
    });
  } catch (error) {
    console.error('Plan purchase error:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
});

// Helper function to get billing cycle duration in milliseconds
function getBillingCycleMs(cycle) {
  switch (cycle) {
  case 'monthly':
    return 30 * 24 * 60 * 60 * 1000;
  case 'quarterly':
    return 90 * 24 * 60 * 60 * 1000;
  case 'semi-annual':
    return 180 * 24 * 60 * 60 * 1000;
  case 'annual':
    return 365 * 24 * 60 * 60 * 1000;
  default:
    return 30 * 24 * 60 * 60 * 1000;
  }
}

module.exports = router;
