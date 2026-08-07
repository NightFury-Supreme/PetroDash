const express = require('express');
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { getClient } = require('../lib/redis');

const getStore = () => {
  const client = getClient();
  return client ? new RedisStore({ sendCommand: (...args) => client.call(...args) }) : undefined;
};

const listLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, store: getStore(), message: { error: 'Too many requests' } });
const createLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, store: getStore(), message: { error: 'Too many requests' } });
const actionLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, store: getStore(), message: { error: 'Too many requests' } });
const Plan = require('../models/Plan');
const { getSettings } = require('../lib/settings');
const Subscription = require('../models/Subscription');
const Coupon = require('../models/Coupon');
const { getAccessToken } = require('../lib/paypal');

const router = express.Router();


// GET /api/subscriptions - list my subscriptions
router.get('/', requireAuth, listLimiter, async (req, res) => {
  const { getCache, setCache } = require('../lib/redis');
  const cacheKey = `subscriptions:mine:${req.user.sub}`;
  
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const list = await Subscription.find({ userId: req.user.sub }).populate('planId', 'name interval price').lean();
  
  await setCache(cacheKey, list, 30);
  res.json(list);
});

// POST /api/subscriptions - create a subscription for a plan
router.post('/', requireAuth, createLimiter, async (req, res) => {
  try {
    const { planId, couponCode } = req.body || {};
    if (!planId) return res.status(400).json({ error: 'planId is required' });
    
    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(planId)) {
      return res.status(400).json({ error: 'Invalid plan ID format' });
    }
    
    const plan = await Plan.findById(String(planId)).lean();
    if (!plan || !plan.paypalPlanId) return res.status(400).json({ error: 'Plan not configured for subscriptions' });
    const { token, baseUrl } = await getAccessToken();
    const s = await getSettings();
    // Optional: coupon validation (no price change is sent to PayPal here; for full discounts you need PayPal Plans/Offers)
    let coupon = null;
    if (couponCode) {
      const now = new Date();
      coupon = await Coupon.findOne({ code: { $eq: String(couponCode).toUpperCase() } });
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
router.post('/confirm', requireAuth, actionLimiter, async (req, res) => {
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
    const paypalPlanId = data.plan_id; // PayPal field is plan_id
    
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
router.post('/:id/pause', requireAuth, actionLimiter, async (req, res) => {
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
router.post('/:id/resume', requireAuth, actionLimiter, async (req, res) => {
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
router.post('/:id/upgrade', requireAuth, createLimiter, async (req, res) => {
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
router.post('/:id/cancel', requireAuth, createLimiter, async (req, res) => {
  try {
    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid subscription ID format' });
    }
    
    const sub = await Subscription.findOne({ _id: req.params.id, userId: req.user.sub });
    if (!sub) return res.status(404).json({ error: 'Not found' });
    sub.cancelAtPeriodEnd = true;
    await sub.save();
    
    const { deleteCachePattern } = require('../lib/redis');
    await deleteCachePattern(`subscriptions:mine:${req.user.sub}`);
    
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;


