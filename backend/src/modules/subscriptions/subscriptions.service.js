const axios = require('axios');
const User = require('../../models/User');
const Plan = require('../../models/Plan');
const Subscription = require('../../models/Subscription');
const Coupon = require('../../models/Coupon');
const { getAccessToken } = require('../../lib/paypal');
const { getSettings } = require('../../lib/settings');
const { getCache, setCache, deleteCache } = require('../../lib/redis');
const AppError = require('../../utils/AppError');
const { buildIdFilter, formatPublicEntity } = require('../../utils/publicId');

const PAYPAL_SUB_ID_REGEX = /^[A-Z0-9_-]+$/i;

class SubscriptionsService {
  async listMySubscriptions(userId) {
    const user = await User.findOne(buildIdFilter(userId)).select('_id publicId').lean();
    if (!user) return [];

    const cacheKey = `subscriptions:mine:${user.publicId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const list = await Subscription.find({ userId: user._id })
      .populate('planId', 'name interval price publicId')
      .lean();

    const formattedList = list.map((s) => {
      const planObj = s.planId && typeof s.planId === 'object'
        ? formatPublicEntity(s.planId, 'plan')
        : s.planId;

      return formatPublicEntity({
        ...s,
        planId: planObj,
      }, 'subscription');
    });

    await setCache(cacheKey, formattedList, 30);
    return formattedList;
  }

  async createSubscription(userId, planId, couponCode) {
    const plan = await Plan.findOne(buildIdFilter(planId)).lean();
    if (!plan || !plan.enabled || !plan.paypalPlanId) {
      throw AppError.badRequest('Plan not configured for subscriptions', 'ERR_PLAN_NOT_CONFIGURED');
    }

    if (couponCode) {
      await this._validateCoupon(couponCode, plan);
    }

    const { token, baseUrl } = await getAccessToken();
    const s = await getSettings();
    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    if (!frontendUrl) {
      throw AppError.internal('FRONTEND_URL environment variable is required', 'ERR_CONFIG_MISSING');
    }

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
    const user = await User.findOne(buildIdFilter(userId)).select('_id publicId').lean();
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
    const sub = await Subscription.findOne({ ...buildIdFilter(subscriptionId), userId: user._id });
    if (!sub) throw AppError.notFound('Subscription not found', 'ERR_SUBSCRIPTION_NOT_FOUND');
    sub.status = 'paused';
    await sub.save();
    await deleteCache(`subscriptions:mine:${user.publicId}`);
  }

  async resumeSubscription(userId, subscriptionId) {
    const user = await User.findOne(buildIdFilter(userId)).select('_id publicId').lean();
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
    const sub = await Subscription.findOne({ ...buildIdFilter(subscriptionId), userId: user._id });
    if (!sub) throw AppError.notFound('Subscription not found', 'ERR_SUBSCRIPTION_NOT_FOUND');
    sub.status = 'active';
    await sub.save();
    await deleteCache(`subscriptions:mine:${user.publicId}`);
  }

  async upgradeSubscription(userId, subscriptionId, newPlanId) {
    const user = await User.findOne(buildIdFilter(userId)).select('_id publicId').lean();
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
    const sub = await Subscription.findOne({ ...buildIdFilter(subscriptionId), userId: user._id });
    if (!sub) throw AppError.notFound('Subscription not found', 'ERR_SUBSCRIPTION_NOT_FOUND');
    const newPlan = await Plan.findOne(buildIdFilter(newPlanId)).lean();
    if (!newPlan || !newPlan.enabled) throw AppError.notFound('Plan not found', 'ERR_PLAN_NOT_FOUND');
    sub.pendingChange = { newPlanId: newPlan._id, at: new Date() };
    await sub.save();
    await deleteCache(`subscriptions:mine:${user.publicId}`);
  }

  async cancelSubscription(userId, subscriptionId) {
    const user = await User.findOne(buildIdFilter(userId)).select('_id publicId').lean();
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
    const sub = await Subscription.findOne({ ...buildIdFilter(subscriptionId), userId: user._id });
    if (!sub) throw AppError.notFound('Subscription not found', 'ERR_SUBSCRIPTION_NOT_FOUND');
    sub.cancelAtPeriodEnd = true;
    await sub.save();
    await deleteCache(`subscriptions:mine:${user.publicId}`);
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
