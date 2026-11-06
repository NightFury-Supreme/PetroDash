const express = require('express');
const { createRateLimiter } = require('../middleware/rateLimit');
const axios = require('axios');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { writeAudit } = require('../middleware/audit');
const { logUserActivity } = require('../middleware/userActivity');
const User = require('../models/User');
const Plan = require('../models/Plan');
const UserPlan = require('../models/UserPlan');
const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');
const { getAccessToken } = require('../lib/paypal');
const AppError = require('../utils/AppError');
const { isValidEntityId, buildIdFilter } = require('../utils/publicId');

const router = express.Router();

const {
  PAYPAL_SUPPORTED_CURRENCIES,
  isPayPalSupported,
  formatCurrencyAmount,
} = require('../config/currencies');
const {
  calcPrice,
  handleFreePlanOrder,
} = require('./paypalUtils');

router.get('/test', requireAdmin, async (req, res, next) => {
  try {
    await getAccessToken();
    res.json({ ok: true });
  } catch (_e) {
    next(AppError.badRequest('Failed to authenticate with PayPal', 'ERR_PAYPAL_CONFIG', { needsConfiguration: true }));
  }
});

router.post('/create-order', requireAuth, createRateLimiter(10, 60 * 1000), async (req, res, next) => {
  try {
    const userId = String(req.user?.sub || '');
    if (!userId) throw AppError.unauthorized();

    const userDoc = await User.findOne(buildIdFilter(userId)).select('_id publicId username email firstName lastName').lean();
    if (!userDoc) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const { planId, billingCycle = 'monthly', couponCode } = req.body || {};
    if (!planId) throw AppError.badRequest('planId is required', 'ERR_REQUIRED_FIELD');
    if (!isValidEntityId(planId, 'plan')) {
      throw AppError.badRequest('Invalid plan ID format', 'ERR_INVALID_ID');
    }

    const validCycles = ['monthly', 'quarterly', 'semi-annual', 'annual', 'lifetime'];
    if (!validCycles.includes(billingCycle)) {
      throw AppError.badRequest('Invalid billing cycle', 'ERR_INVALID_CYCLE');
    }

    const plan = await Plan.findOne(buildIdFilter(planId)).lean();
    if (!plan) throw AppError.notFound('Plan not found', 'ERR_PLAN_NOT_FOUND');
    if (!plan.enabled) throw AppError.badRequest('ERR_PLAN_UNAVAILABLE', 'ERR_PLAN_UNAVAILABLE');

    const now = new Date();
    if (plan.availableAt && now < new Date(plan.availableAt)) throw AppError.badRequest('Plan not yet available', 'ERR_PLAN_UNAVAILABLE');
    if (plan.availableUntil && now > new Date(plan.availableUntil)) throw AppError.badRequest('Plan no longer available', 'ERR_PLAN_EXPIRED');

    const activeCondition = {
      status: 'active',
      $or: [
        { isLifetime: true },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    };

    if (plan.stock > 0) {
      const purchasedCount = await UserPlan.countDocuments({
        planId: plan._id,
        ...activeCondition
      });
      if (purchasedCount >= plan.stock) throw AppError.badRequest('Plan is out of stock', 'ERR_OUT_OF_STOCK');
    }

    if (plan.limitPerCustomer > 0) {
      const userPurchases = await UserPlan.countDocuments({
        userId: userDoc._id,
        planId: plan._id,
        ...activeCondition
      });
      if (userPurchases >= plan.limitPerCustomer) throw AppError.badRequest('You have reached the purchase limit for this plan', 'ERR_LIMIT_REACHED');
    }

    if (plan.billingOptions?.lifetime) {
      if (billingCycle !== 'lifetime') throw AppError.badRequest('Lifetime plans use lifetime billing cycle', 'ERR_INVALID_CYCLE');
    } else if (plan.availableBillingCycles && !plan.availableBillingCycles.includes(billingCycle)) {
      throw AppError.badRequest('Billing cycle not available for this plan', 'ERR_INVALID_CYCLE');
    }

    let finalPrice = calcPrice(plan, billingCycle);
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: { $eq: String(couponCode).toUpperCase().trim() }, enabled: true }).lean();
      if (!coupon) throw AppError.badRequest('Invalid coupon code', 'ERR_INVALID_COUPON');

      if (coupon.validFrom && now < new Date(coupon.validFrom)) throw AppError.badRequest('Coupon not yet valid', 'ERR_COUPON_NOT_STARTED');
      if (coupon.validUntil && now > new Date(coupon.validUntil)) throw AppError.badRequest('Coupon expired', 'ERR_COUPON_EXPIRED');
      if (coupon.maxRedemptions && coupon.redeemedCount >= coupon.maxRedemptions) throw AppError.badRequest('Coupon usage limit reached', 'ERR_COUPON_LIMIT');
      if (coupon.appliesToPlanIds?.length && !coupon.appliesToPlanIds.map(String).includes(String(plan._id))) {
        throw AppError.badRequest('Coupon not applicable to this plan', 'ERR_COUPON_INAPPLICABLE');
      }

      discountAmount = coupon.type === 'percentage' ? (finalPrice * coupon.value) / 100 : coupon.value;
    }
    finalPrice = Math.max(0, finalPrice - discountAmount);

    const { token, baseUrl, paypal, settings } = await getAccessToken();
    if (!paypal.enabled) throw AppError.badRequest('PayPal payments are disabled', 'ERR_PAYPAL_DISABLED');

    const siteCurrency = (settings?.localization?.currency || 'USD').toUpperCase();
    if (!isPayPalSupported(siteCurrency)) {
      throw AppError.badRequest(`Currency "${siteCurrency}" is not supported by PayPal`, 'ERR_UNSUPPORTED_CURRENCY', {
        supportedCurrencies: [...PAYPAL_SUPPORTED_CURRENCIES]
      });
    }

    const userSnapshot = {
      publicId: userDoc.publicId || req.user?.publicId || '',
      username: userDoc.username || req.user?.username || '',
      email: userDoc.email || '',
      firstName: userDoc.firstName || '',
      lastName: userDoc.lastName || '',
    };

    if (finalPrice === 0) {
      return handleFreePlanOrder(req, res, {
        plan, billingCycle, couponCode, discountAmount, userId: userDoc._id, siteCurrency, userSnapshot,
      });
    }

    const amountStr = formatCurrencyAmount(finalPrice, siteCurrency);
    const brandName = (paypal.businessName || 'PteroDash').slice(0, 127);

    const orderBody = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: String(plan.publicId),
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
    } catch (_paypalErr) {
      throw AppError.badRequest('PayPal payment initiation failed', 'ERR_PAYPAL_GATEWAY');
    }

    await Payment.create({
      provider: 'paypal',
      providerOrderId: order.id,
      userId: userDoc._id,
      planId: plan._id,
      amount: Number(amountStr),
      currency: siteCurrency,
      status: 'CREATED',
      meta: {
        billingCycle,
        couponCode: couponCode || null,
        discountAmount,
        isLifetime: billingCycle === 'lifetime' || Boolean(plan.billingOptions?.lifetime),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userSnapshot,
      }
    });

    const publicPlanId = plan.publicId;
    await logUserActivity(req, 'shop.payment.create', { orderId: order.id, planId: publicPlanId, billingCycle, price: Number(amountStr) });
    await writeAudit(req, 'shop.payment.create', 'payment', order.id, { planId: publicPlanId, billingCycle, price: Number(amountStr) });
    return res.json(order);
  } catch (e) {
    next(e instanceof AppError ? e : AppError.internal('Failed to create PayPal order', 'ERR_PAYPAL_ORDER_CREATION'));
  }
});

router.post('/cancel-order', requireAuth, createRateLimiter(20, 60 * 1000), async (req, res, next) => {
  try {
    const userId = String(req.user?.sub || '');
    if (!userId) throw AppError.unauthorized();

    const userDoc = await User.findOne(buildIdFilter(userId)).select('_id').lean();
    if (!userDoc) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const { orderId } = req.body || {};
    if (!orderId) throw AppError.badRequest('orderId is required', 'ERR_REQUIRED_FIELD');

    const sanitizedOrderId = String(orderId).trim();
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(sanitizedOrderId)) {
      throw AppError.badRequest('Invalid orderId format', 'ERR_INVALID_ORDER_ID');
    }

    const payment = await Payment.findOne({ providerOrderId: sanitizedOrderId, userId: userDoc._id, status: 'CREATED' });
    if (payment) {
      payment.status = 'VOIDED';
      await payment.save();
    }
    
    await logUserActivity(req, 'shop.payment.cancel', { orderId: sanitizedOrderId });
    await writeAudit(req, 'shop.payment.cancel', 'payment', sanitizedOrderId, {});
    return res.json({ success: true });
  } catch (e) {
    next(e instanceof AppError ? e : AppError.internal('Failed to cancel order', 'ERR_PAYPAL_ORDER_CANCELLATION'));
  }
});

router.post('/capture-order', requireAuth, createRateLimiter(10, 60 * 1000), async (req, res, next) => {
  try {
    const userId = String(req.user?.sub || '');
    if (!userId) throw AppError.unauthorized();

    const userDoc = await User.findOne(buildIdFilter(userId)).select('_id').lean();
    if (!userDoc) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const { orderId } = req.body || {};
    if (!orderId) throw AppError.badRequest('orderId is required', 'ERR_REQUIRED_FIELD');

    const sanitizedOrderId = String(orderId).trim();
    if (!/^[A-Z0-9]{17,20}$/.test(sanitizedOrderId)) {
      throw AppError.badRequest('Invalid order ID format', 'ERR_INVALID_ID');
    }

    const { token, baseUrl } = await getAccessToken();

    let captureData;
    try {
      const r = await axios.post(
        `${baseUrl}/v2/checkout/orders/${encodeURIComponent(sanitizedOrderId)}/capture`,
        {},
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      captureData = r.data;
    } catch (_paypalErr) {
      throw AppError.badRequest('PayPal payment capture failed', 'ERR_PAYPAL_GATEWAY');
    }

    const orderStatus = String(captureData?.status || '').toUpperCase();
    if (orderStatus !== 'COMPLETED') {
      throw AppError.badRequest(`Order not completed (status: ${orderStatus})`, 'ERR_PAYMENT_INCOMPLETE');
    }

    const payment = await Payment.findOne({ provider: 'paypal', providerOrderId: captureData.id });
    if (!payment) throw AppError.badRequest('Unknown order — not created through this system', 'ERR_ORDER_UNKNOWN');
    if (String(payment.userId) !== String(userDoc._id)) throw AppError.forbidden('Forbidden', 'ERR_FORBIDDEN');

    const { processCapturedPayment } = require('../lib/paymentProcessor');
    const result = await processCapturedPayment(payment, captureData, sanitizedOrderId);

    if (!result.success) {
      throw AppError.badRequest(result.error || 'Failed to process payment', 'ERR_PAYMENT_FAILED');
    }

    const publicPaymentId = payment.publicId;
    await logUserActivity(req, 'shop.payment.capture', { orderId: sanitizedOrderId, status: 'COMPLETED' });
    await writeAudit(req, 'shop.payment.capture', 'payment', publicPaymentId, { orderId: sanitizedOrderId, status: 'COMPLETED' });

    const { calculateUserTotalResources } = require('../utils/resourceCalculator');
    const { totalResources } = await calculateUserTotalResources(result.user);

    return res.json({
      ok: true,
      order: captureData,
      user: {
        coins: result.user.coins,
        resources: totalResources,
        baseResources: result.user.resources
      }
    });
  } catch (e) {
    next(e instanceof AppError ? e : AppError.internal('Failed to capture payment', 'ERR_PAYPAL_ORDER_CAPTURE'));
  }
});

module.exports = router;
