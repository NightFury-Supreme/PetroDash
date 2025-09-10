const express = require('express');
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const Plan = require('../models/Plan');
const Settings = require('../models/Settings');
const Subscription = require('../models/Subscription');
const Coupon = require('../models/Coupon');

const router = express.Router();

async function getAccessToken() {
  const s = await Settings.findOne({}).lean();
  const paypal = s?.payments?.paypal || {};
  const baseUrl = paypal.mode === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
  const res = await axios.post(`${baseUrl}/v1/oauth2/token`, new URLSearchParams({ grant_type: 'client_credentials' }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, auth: { username: paypal.clientId, password: paypal.clientSecret } });
  return { token: res.data.access_token, baseUrl, paypal };
}

// GET /api/subscriptions - list my subscriptions
router.get('/', requireAuth, createRateLimiter(30, 60 * 1000), async (req, res) => {
  const list = await Subscription.find({ userId: req.user.sub }).populate('planId', 'name interval price').lean();
  res.json(list);
});

// POST /api/subscriptions - create a subscription for a plan
router.post('/', requireAuth, createRateLimiter(5, 60 * 1000), async (req, res) => {
  try {
    const { planId, couponCode } = req.body || {};
    if (!planId) return res.status(400).json({ error: 'planId is required' });
    
    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(planId)) {
      return res.status(400).json({ error: 'Invalid plan ID format' });
    }
    
    const plan = await Plan.findById(planId).lean();
    if (!plan || !plan.paypalPlanId) return res.status(400).json({ error: 'Plan not configured for subscriptions' });
    const { token, baseUrl } = await getAccessToken();
    const s = await Settings.findOne({}).lean();
    // Optional: coupon validation (no price change is sent to PayPal here; for full discounts you need PayPal Plans/Offers)
    let coupon = null;
    if (couponCode) {
      const now = new Date();
      coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase() });
      if (!coupon) return res.status(400).json({ error: 'Invalid coupon' });
      if (coupon.validFrom && now < coupon.validFrom) return res.status(400).json({ error: 'Coupon not yet valid' });
      if (coupon.validUntil && now > coupon.validUntil) return res.status(400).json({ error: 'Coupon expired' });
      if (coupon.maxRedemptions && coupon.redeemedCount >= coupon.maxRedemptions) return res.status(400).json({ error: 'Coupon exhausted' });
      if (coupon.appliesToPlanIds?.length && !coupon.appliesToPlanIds.map(String).includes(String(plan._id))) return res.status(400).json({ error: 'Coupon not applicable to this plan' });
    }
    const start = await axios.post(`${baseUrl}/v1/billing/subscriptions`, {
      plan_id: plan.paypalPlanId,
      application_context: {
        brand_name: s?.siteName || 'PteroDash',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/plan/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/plan/cancel`,
      }
    }, { headers: { Authorization: `Bearer ${token}` } });
    res.json(start.data);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST /api/subscriptions/confirm - confirm approved subscription by id from return URL
router.post('/confirm', requireAuth, createRateLimiter(10, 60 * 1000), async (req, res) => {
  try {
    const { subscriptionId, couponCode } = req.body || {};
    if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId required' });
    
    // Validate subscriptionId to prevent SSRF attacks
    // PayPal subscription IDs are typically alphanumeric with hyphens and underscores
    const sanitizedSubscriptionId = String(subscriptionId).trim();
    if (!/^[A-Z0-9_-]+$/i.test(sanitizedSubscriptionId)) {
      return res.status(400).json({ error: 'Invalid subscription ID format' });
    }
    
    // Additional length validation (PayPal subscription IDs are typically 20-50 characters)
    if (sanitizedSubscriptionId.length < 10 || sanitizedSubscriptionId.length > 100) {
      return res.status(400).json({ error: 'Invalid subscription ID length' });
    }
    
    const { token, baseUrl } = await getAccessToken();
    const r = await axios.get(`${baseUrl}/v1/billing/subscriptions/${encodeURIComponent(sanitizedSubscriptionId)}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = r.data || {};
    const status = String(data.status || '').toLowerCase();
    const start = new Date(data.start_time || Date.now());
    const next = new Date(data.billing_info?.next_billing_time || Date.now());
    const paypalPlanId = data.plan_id || data.plan_id || data.plan_id; // PayPal field is plan_id
    
    // Validate paypalPlanId to prevent NoSQL injection
    if (!paypalPlanId || typeof paypalPlanId !== 'string') {
      return res.status(400).json({ error: 'Invalid PayPal plan ID' });
    }
    
    const plan = await Plan.findOne({ paypalPlanId: { $eq: paypalPlanId } }).lean();
    if (!plan) return res.status(404).json({ error: 'Linked plan not found' });
    await Subscription.updateOne(
      { paypalSubscriptionId: sanitizedSubscriptionId },
      { $set: { userId: req.user.sub, planId: plan._id, status, currentPeriodStart: start, currentPeriodEnd: next, cancelAtPeriodEnd: false, couponCode } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST /api/subscriptions/:id/pause
router.post('/:id/pause', requireAuth, createRateLimiter(10, 60 * 1000), async (req, res) => {
  // Validate ObjectId format to prevent NoSQL injection
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid subscription ID format' });
  }
  
  const sub = await Subscription.findOne({ _id: req.params.id, userId: req.user.sub });
  if (!sub) return res.status(404).json({ error: 'Not found' });
  sub.status = 'paused';
  await sub.save();
  res.json({ ok: true });
});

// POST /api/subscriptions/:id/resume
router.post('/:id/resume', requireAuth, createRateLimiter(10, 60 * 1000), async (req, res) => {
  // Validate ObjectId format to prevent NoSQL injection
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid subscription ID format' });
  }
  
  const sub = await Subscription.findOne({ _id: req.params.id, userId: req.user.sub });
  if (!sub) return res.status(404).json({ error: 'Not found' });
  sub.status = 'active';
  await sub.save();
  res.json({ ok: true });
});

// POST /api/subscriptions/:id/upgrade - change plan (proration TBD)
router.post('/:id/upgrade', requireAuth, createRateLimiter(5, 60 * 1000), async (req, res) => {
  const { newPlanId } = req.body || {};
  if (!newPlanId) return res.status(400).json({ error: 'newPlanId required' });
  
  // Validate ObjectId format to prevent NoSQL injection
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid subscription ID format' });
  }
  if (!/^[0-9a-fA-F]{24}$/.test(newPlanId)) {
    return res.status(400).json({ error: 'Invalid plan ID format' });
  }
  
  const sub = await Subscription.findOne({ _id: req.params.id, userId: req.user.sub });
  if (!sub) return res.status(404).json({ error: 'Not found' });
  // For MVP: store desired change; webhook will reconcile on next renewal
  sub.pendingChange = { newPlanId, at: new Date() };
  sub.save();
  res.json({ ok: true });
});

// POST /api/subscriptions/:id/cancel - cancel at period end
router.post('/:id/cancel', requireAuth, createRateLimiter(5, 60 * 1000), async (req, res) => {
  try {
    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid subscription ID format' });
    }
    
    const sub = await Subscription.findOne({ _id: req.params.id, userId: req.user.sub });
    if (!sub) return res.status(404).json({ error: 'Not found' });
    sub.cancelAtPeriodEnd = true;
    await sub.save();
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;


