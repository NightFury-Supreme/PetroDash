/*
  Subscriptions Service
  Handles PayPal subscription lifecycle: listing, creating, confirming,
  pausing, resuming, upgrading, and cancelling subscriptions.
*/

const axios = require('axios');
const Plan = require('../../models/Plan');
const Subscription = require('../../models/Subscription');
const Coupon = require('../../models/Coupon');
const { getAccessToken } = require('../../lib/paypal');
const { getSettings } = require('../../lib/settings');
const { getCache, setCache, deleteCachePattern } = require('../../lib/redis');
const AppError = require('../../utils/AppError');

const PAYPAL_SUB_ID_REGEX = /^[A-Z0-9_-]+$/i;

class SubscriptionsService {
  async listMySubscriptions(userId) {
    const cacheKey = `subscriptions:mine:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const list = await Subscription.find({ userId })
      .populate('planId', 'name interval price')
      .lean();

    await setCache(cacheKey, list, 30);
    return list;
  }

  async createSubscription(userId, planId, couponCode) {
    const plan = await Plan.findById(String(planId)).lean();
    if (!plan || !plan.paypalPlanId) {
      throw AppError.badRequest('Plan not configured for subscriptions', 'ERR_PLAN_NOT_CONFIGURED');
    }

    if (couponCode) {
      await this._validateCoupon(couponCode, plan);
    }

    const { token, baseUrl } = await getAccessToken();
    const s = await getSettings();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const response = await axios.post(
      `${baseUrl}/v1/billing/subscriptions`,
      {
        plan_id: plan.paypalPlanId,
        application_context: {
          brand_name: s?.siteName || 'PteroDash',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${frontendUrl}/plan/success`,
          cancel_url: `${frontendUrl}/plan/cancel`,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  }

  async confirmSubscription(userId, subscriptionId, couponCode) {
    const sanitized = String(subscriptionId).trim();
    if (!PAYPAL_SUB_ID_REGEX.test(sanitized)) {
      throw AppError.badRequest('Invalid subscription ID format', 'ERR_INVALID_SUBSCRIPTION_ID');
    }
    if (sanitized.length < 10 || sanitized.length > 100) {
      throw AppError.badRequest('Invalid subscription ID length', 'ERR_INVALID_SUBSCRIPTION_ID');
    }

    const { token, baseUrl } = await getAccessToken();
    const { data } = await axios.get(
      `${baseUrl}/v1/billing/subscriptions/${encodeURIComponent(sanitized)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const status = String(data.status || '').toLowerCase();
    const start = new Date(data.start_time || Date.now());
    const nextDate = new Date(data.billing_info?.next_billing_time || Date.now());
    const paypalPlanId = data.plan_id;

    if (!paypalPlanId || typeof paypalPlanId !== 'string') {
      throw AppError.badRequest('Invalid PayPal plan ID', 'ERR_INVALID_PLAN_ID');
    }

    const plan = await Plan.findOne({ paypalPlanId: { $eq: paypalPlanId } }).lean();
    if (!plan) throw AppError.notFound('Linked plan not found', 'ERR_PLAN_NOT_FOUND');

    await Subscription.updateOne(
      { paypalSubscriptionId: sanitized },
      {
        $set: {
          userId,
          planId: plan._id,
          status,
          currentPeriodStart: start,
          currentPeriodEnd: nextDate,
          cancelAtPeriodEnd: false,
          couponCode,
        },
      },
      { upsert: true }
    );
  }

  async pauseSubscription(userId, subscriptionId) {
    const sub = await Subscription.findOne({ _id: String(subscriptionId), userId });
    if (!sub) throw AppError.notFound('Subscription not found', 'ERR_SUBSCRIPTION_NOT_FOUND');
    sub.status = 'paused';
    await sub.save();
  }

  async resumeSubscription(userId, subscriptionId) {
    const sub = await Subscription.findOne({ _id: String(subscriptionId), userId });
    if (!sub) throw AppError.notFound('Subscription not found', 'ERR_SUBSCRIPTION_NOT_FOUND');
    sub.status = 'active';
    await sub.save();
  }

  async upgradeSubscription(userId, subscriptionId, newPlanId) {
    const sub = await Subscription.findOne({ _id: String(subscriptionId), userId });
    if (!sub) throw AppError.notFound('Subscription not found', 'ERR_SUBSCRIPTION_NOT_FOUND');
    sub.pendingChange = { newPlanId, at: new Date() };
    await sub.save();
  }

  async cancelSubscription(userId, subscriptionId) {
    const sub = await Subscription.findOne({ _id: String(subscriptionId), userId });
    if (!sub) throw AppError.notFound('Subscription not found', 'ERR_SUBSCRIPTION_NOT_FOUND');
    sub.cancelAtPeriodEnd = true;
    await sub.save();
    await deleteCachePattern(`subscriptions:mine:${userId}`);
  }

  async _validateCoupon(couponCode, plan) {
    const now = new Date();
    const coupon = await Coupon.findOne({ code: { $eq: String(couponCode).toUpperCase() } });
    if (!coupon) throw AppError.badRequest('Invalid coupon', 'ERR_COUPON_INVALID');
    if (coupon.validFrom && now < coupon.validFrom) throw AppError.badRequest('Coupon not yet valid', 'ERR_COUPON_NOT_YET_VALID');
    if (coupon.validUntil && now > coupon.validUntil) throw AppError.badRequest('Coupon expired', 'ERR_COUPON_EXPIRED');
    if (coupon.maxRedemptions && coupon.redeemedCount >= coupon.maxRedemptions) throw AppError.badRequest('Coupon usage limit reached', 'ERR_COUPON_LIMIT_REACHED');
    if (coupon.appliesToPlanIds?.length && !coupon.appliesToPlanIds.map(String).includes(String(plan._id))) {
      throw AppError.badRequest('Coupon not applicable to this plan', 'ERR_COUPON_NOT_APPLICABLE');
    }
    return coupon;
  }
}

module.exports = new SubscriptionsService();
