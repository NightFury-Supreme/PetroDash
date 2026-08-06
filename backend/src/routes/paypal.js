const express = require('express');
const { createRateLimiter } = require('../middleware/rateLimit');
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');
const Plan = require('../models/Plan');
// eslint-disable-next-line unused-imports/no-unused-vars
const User = require('../models/User');
const UserPlan = require('../models/UserPlan');
const Coupon = require('../models/Coupon');
// eslint-disable-next-line unused-imports/no-unused-vars
const { writeAudit } = require('../middleware/audit');
const Payment = require('../models/Payment');
// eslint-disable-next-line unused-imports/no-unused-vars
const { sendMailTemplate } = require('../lib/mail');
const { getAccessToken } = require('../lib/paypal');

const router = express.Router();

// PayPal-supported currencies (official list)
// https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies/
const PAYPAL_SUPPORTED_CURRENCIES = new Set([
  'AUD', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EUR', 'HKD', 'HUF', 'ILS',
  'JPY', 'MYR', 'MXN', 'TWD', 'NZD', 'NOK', 'PHP', 'PLN', 'GBP', 'SGD',
  'SEK', 'CHF', 'THB', 'USD'
]);

/**
 * Extract a human-readable error message from a PayPal axios error.
 */
function extractPayPalError(err) {
  const data = err?.response?.data;
  if (!data) return err.message;
  return (
    data.details?.[0]?.description ||
    data.message ||
    data.error_description ||
    data.details?.[0]?.issue ||
    err.message
  );
}

/**
 * Calculate the price for a given billing cycle.
 */
function calcPrice(plan, billingCycle) {
  switch (billingCycle) {
    case 'quarterly':   return plan.pricePerMonth * 3;
    case 'semi-annual': return plan.pricePerMonth * 6;
    case 'annual':      return plan.pricePerMonth * 12;
    case 'lifetime':
    case 'monthly':
    default:            return plan.pricePerMonth;
  }
}

// GET /api/paypal/test — verify PayPal credentials are configured
router.get('/test', requireAuth, async (req, res) => {
  try {
    await getAccessToken();
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message, needsConfiguration: true });
  }
});

// POST /api/paypal/create-order
router.post('/create-order', requireAuth, createRateLimiter(10, 60 * 1000), async (req, res) => {
  try {
    // requireAuth guarantees req.user is set and verified
    const userId = String(req.user?.sub || '');
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { planId, billingCycle = 'monthly', couponCode } = req.body || {};
    if (!planId) return res.status(400).json({ error: 'planId is required' });
    if (!/^[0-9a-fA-F]{24}$/.test(planId)) {
      return res.status(400).json({ error: 'Invalid plan ID format' });
    }

    const validCycles = ['monthly', 'quarterly', 'semi-annual', 'annual', 'lifetime'];
    if (!validCycles.includes(billingCycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    const plan = await Plan.findById(planId).lean();
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    // Check plan availability
    const now = new Date();
    if (plan.availableAt && now < new Date(plan.availableAt)) return res.status(400).json({ error: 'Plan not yet available' });
    if (plan.availableUntil && now > new Date(plan.availableUntil)) return res.status(400).json({ error: 'Plan no longer available' });

    // Check plan stock
    if (plan.stock === -1) return res.status(400).json({ error: 'Plan is unavailable' });
    if (plan.stock > 0) {
      const purchasedCount = await UserPlan.countDocuments({ planId: { $eq: planId }, status: { $eq: 'active' } });
      if (purchasedCount >= plan.stock) return res.status(400).json({ error: 'Plan is out of stock' });
    }

    // Check customer limits
    if (plan.limitPerCustomer > 0) {
      const userPurchases = await UserPlan.countDocuments({ userId: { $eq: req.user.sub }, planId: { $eq: planId }, status: { $eq: 'active' } });
      if (userPurchases >= plan.limitPerCustomer) return res.status(400).json({ error: 'You have reached the purchase limit for this plan' });
    }

    // Validate billing cycle availability
    if (plan.billingOptions?.lifetime) {
      if (billingCycle !== 'lifetime') return res.status(400).json({ error: 'Lifetime plans use lifetime billing cycle' });
    } else {
      if (plan.availableBillingCycles && !plan.availableBillingCycles.includes(billingCycle)) {
        return res.status(400).json({ error: 'Billing cycle not available for this plan' });
      }
    }

    // Calculate price
    let finalPrice = calcPrice(plan, billingCycle);

    // Apply coupon securely
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), enabled: true }).lean();
      if (!coupon) return res.status(400).json({ error: 'Invalid coupon code' });

      if (coupon.validFrom && now < new Date(coupon.validFrom)) return res.status(400).json({ error: 'Coupon not yet valid' });
      if (coupon.validUntil && now > new Date(coupon.validUntil)) return res.status(400).json({ error: 'Coupon expired' });
      if (coupon.maxRedemptions && coupon.redeemedCount >= coupon.maxRedemptions) return res.status(400).json({ error: 'Coupon usage limit reached' });
      if (coupon.appliesToPlanIds?.length && !coupon.appliesToPlanIds.map(String).includes(String(plan._id))) {
        return res.status(400).json({ error: 'Coupon not applicable to this plan' });
      }

      if (coupon.type === 'percentage') {
        discountAmount = (finalPrice * coupon.value) / 100;
      } else {
        discountAmount = coupon.value;
      }
    }
    finalPrice = Math.max(0, finalPrice - discountAmount);

    // Get PayPal config
    const { token, baseUrl, paypal, settings } = await getAccessToken();
    if (!paypal.enabled) return res.status(400).json({ error: 'PayPal payments are disabled' });

    const siteCurrency = (settings?.localization?.currency || 'USD').toUpperCase();
    if (!PAYPAL_SUPPORTED_CURRENCIES.has(siteCurrency)) {
      return res.status(400).json({
        error: `Currency "${siteCurrency}" is not supported by PayPal`,
        details: `Go to Admin → Settings → Localization and select a supported currency.`,
        supportedCurrencies: [...PAYPAL_SUPPORTED_CURRENCIES]
      });
    }

    let amountToCharge = finalPrice;

    if (amountToCharge === 0) {
      // Direct fast-track for free plans / 100% coupons
      const freeOrderId = `FREE-${Date.now()}-${Math.floor(Math.random()*10000)}`;
      const payment = await Payment.create({
        provider: 'system',
        providerOrderId: freeOrderId,
        userId,
        planId: plan._id,
        amount: 0,
        currency: siteCurrency || 'USD',
        status: 'CREATED',
        meta: {
          billingCycle,
          couponCode: couponCode || null,
          discountAmount,
          isLifetime: billingCycle === 'lifetime' || Boolean(plan.billingOptions?.lifetime)
        }
      });
      
      const { processCapturedPayment } = require('../lib/paymentProcessor');
      const result = await processCapturedPayment(payment, null, freeOrderId);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      return res.json({ id: freeOrderId, status: 'COMPLETED', bypassPaypal: true });
    }

    const amountStr = amountToCharge.toFixed(2);
    const brandName = (paypal.businessName || 'PteroDash').slice(0, 127); // PayPal max 127 chars

    const orderBody = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: String(plan._id),
        amount: { currency_code: siteCurrency, value: amountStr },
        description: `${plan.name} — ${billingCycle}`.slice(0, 127)
      }],
      application_context: {
        brand_name: brandName,
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL}/plan/success`,
        cancel_url: `${process.env.FRONTEND_URL}/plan/cancel`
      }
    };

    let order;
    try {
      const r = await axios.post(`${baseUrl}/v2/checkout/orders`, orderBody, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      order = r.data;
    } catch (paypalErr) {
      const msg = extractPayPalError(paypalErr);
      console.error('[PayPal] create-order failed:', msg, paypalErr?.response?.data);
      return res.status(paypalErr?.response?.status || 502).json({
        error: `PayPal error: ${msg}`,
        details: paypalErr?.response?.data?.details || undefined
      });
    }

    // Persist payment intent
    await Payment.create({
      provider: 'paypal',
      providerOrderId: order.id,
      userId,
      planId: plan._id,
      amount: Number(amountStr),
      currency: siteCurrency,
      status: 'CREATED',
      meta: {
        billingCycle,
        couponCode: couponCode || null,
        discountAmount,
        isLifetime: billingCycle === 'lifetime' || Boolean(plan.billingOptions?.lifetime)
      }
    });

    return res.json(order);
  } catch (e) {
    console.error('[PayPal] create-order unexpected error:', e.message);
    return res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

// POST /api/paypal/capture-order
router.post('/capture-order', requireAuth, createRateLimiter(10, 60 * 1000), async (req, res) => {
  try {
    const userId = String(req.user?.sub || '');
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    // Strict PayPal order ID format validation
    const sanitizedOrderId = String(orderId).trim();
    if (!/^[A-Z0-9]{17,20}$/.test(sanitizedOrderId)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    const { token, baseUrl } = await getAccessToken();

    // Capture the order at PayPal
    let captureData;
    try {
      const r = await axios.post(
        `${baseUrl}/v2/checkout/orders/${encodeURIComponent(sanitizedOrderId)}/capture`,
        {},
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      captureData = r.data;
    } catch (paypalErr) {
      const msg = extractPayPalError(paypalErr);
      console.error('[PayPal] capture-order failed:', msg, paypalErr?.response?.data);
      return res.status(paypalErr?.response?.status || 502).json({
        error: `PayPal error: ${msg}`,
        details: paypalErr?.response?.data?.details || undefined
      });
    }

    // Validate order status
    const orderStatus = String(captureData?.status || '').toUpperCase();
    if (orderStatus !== 'COMPLETED') {
      return res.status(400).json({ error: `Order not completed (status: ${orderStatus})` });
    }

    // Load and verify our payment record
    const payment = await Payment.findOne({ provider: 'paypal', providerOrderId: captureData.id });
    if (!payment) return res.status(400).json({ error: 'Unknown order — not created through this system' });
    if (String(payment.userId) !== userId) return res.status(403).json({ error: 'Forbidden' });

    const { processCapturedPayment } = require('../lib/paymentProcessor');
    const result = await processCapturedPayment(payment, captureData, sanitizedOrderId);

    if (!result.success) {
      if (result.error === 'Payment mismatch — order rejected for security' || result.error === 'Unknown order — not created through this system') {
        return res.status(400).json({ error: result.error });
      }
      if (result.error === 'Plan not found' || result.error === 'User not found') {
        return res.status(404).json({ error: result.error });
      }
      return res.status(500).json({ error: result.error });
    }

    return res.json({ ok: true, order: captureData, user: { coins: result.user.coins, resources: result.user.resources } });
  } catch (e) {
    console.error('[PayPal] capture-order unexpected error:', e.message);
    return res.status(500).json({ error: 'Failed to capture payment' });
  }
});

module.exports = router;