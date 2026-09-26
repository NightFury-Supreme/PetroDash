/*
  Subscriptions Controller
  Orchestrates HTTP requests, input validation, and response formatting
  for PayPal subscription lifecycle operations.
*/

const subscriptionsService = require('./subscriptions.service');
const AppError = require('../../utils/AppError');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

class SubscriptionsController {
  async list(req, res, next) {
    try {
      const list = await subscriptionsService.listMySubscriptions(req.user.sub);
      res.json(list);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { planId, couponCode } = req.body || {};
      if (!planId) throw AppError.badRequest('planId is required', 'ERR_MISSING_PLAN_ID');
      if (!OBJECT_ID_REGEX.test(planId)) throw AppError.badRequest('Invalid plan ID format', 'ERR_INVALID_PLAN_ID');

      const data = await subscriptionsService.createSubscription(req.user.sub, planId, couponCode);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  async confirm(req, res, next) {
    try {
      const { subscriptionId, couponCode } = req.body || {};
      if (!subscriptionId) throw AppError.badRequest('subscriptionId required', 'ERR_MISSING_SUBSCRIPTION_ID');

      await subscriptionsService.confirmSubscription(req.user.sub, subscriptionId, couponCode);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async pause(req, res, next) {
    try {
      if (!OBJECT_ID_REGEX.test(req.params.id)) throw AppError.badRequest('Invalid subscription ID format', 'ERR_INVALID_SUBSCRIPTION_ID');
      await subscriptionsService.pauseSubscription(req.user.sub, req.params.id);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async resume(req, res, next) {
    try {
      if (!OBJECT_ID_REGEX.test(req.params.id)) throw AppError.badRequest('Invalid subscription ID format', 'ERR_INVALID_SUBSCRIPTION_ID');
      await subscriptionsService.resumeSubscription(req.user.sub, req.params.id);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async upgrade(req, res, next) {
    try {
      const { newPlanId } = req.body || {};
      if (!newPlanId) throw AppError.badRequest('newPlanId required', 'ERR_MISSING_PLAN_ID');
      if (!OBJECT_ID_REGEX.test(req.params.id)) throw AppError.badRequest('Invalid subscription ID format', 'ERR_INVALID_SUBSCRIPTION_ID');
      if (!OBJECT_ID_REGEX.test(newPlanId)) throw AppError.badRequest('Invalid plan ID format', 'ERR_INVALID_PLAN_ID');

      await subscriptionsService.upgradeSubscription(req.user.sub, req.params.id, newPlanId);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      if (!OBJECT_ID_REGEX.test(req.params.id)) throw AppError.badRequest('Invalid subscription ID format', 'ERR_INVALID_SUBSCRIPTION_ID');
      await subscriptionsService.cancelSubscription(req.user.sub, req.params.id);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubscriptionsController();
