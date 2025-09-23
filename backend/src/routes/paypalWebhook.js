const express = require('express');
const Settings = require('../models/Settings');
const { verifyWebhookSignature, getAccessToken } = require('../lib/paypal');
const Payment = require('../models/Payment');

const router = express.Router();
const WebhookEvent = require('../models/WebhookEvent');

// Verify PayPal webhook using transmission headers + webhookId via verify-webhook-signature

router.post('/', express.json({ type: '*/*' }), async(req, res) => {
  try {
    const s = await Settings.findOne({}).lean();
    const webhookId = s?.payments?.paypal?.webhookId;
    if (!webhookId) return res.status(400).json({ error: 'Webhook not configured' });

    const ok = await verifyWebhookSignature(
      {
        'paypal-transmission-id': req.header('paypal-transmission-id'),
        'paypal-transmission-time': req.header('paypal-transmission-time'),
        'paypal-cert-url': req.header('paypal-cert-url'),
        'paypal-auth-algo': req.header('paypal-auth-algo'),
        'paypal-transmission-sig': req.header('paypal-transmission-sig')
      },
      req.body
    );
    if (!ok) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body || {};
    const eventId = String(event.id || '');
    if (!eventId) return res.status(400).json({ error: 'Missing event id' });
    // Idempotency check: ignore duplicates
    const exists = await WebhookEvent.findOne({ provider: 'paypal', eventId }).lean();
    if (exists) return res.json({ ok: true, duplicate: true });
    const eventType = String(event.event_type || '').toUpperCase();
    const resource = event.resource || {};

    // Handle subscription lifecycle
    const Subscription = require('../models/Subscription');
    if (eventType.startsWith('BILLING.SUBSCRIPTION.')) {
      const paypalSubId = resource?.id || resource?.subscription_id;
      if (!paypalSubId) return res.json({ ok: true });

      // Validate paypalSubId to prevent NoSQL injection
      if (typeof paypalSubId !== 'string' || paypalSubId.length < 10 || paypalSubId.length > 100) {
        return res.json({ ok: true });
      }

      const sub = await Subscription.findOne({ paypalSubscriptionId: { $eq: paypalSubId } });
      if (!sub && eventType !== 'BILLING.SUBSCRIPTION.CREATED') return res.json({ ok: true });
      if (!sub && eventType === 'BILLING.SUBSCRIPTION.CREATED') {
        // Create skeletal subscription; details will be filled by confirm or next event
        await Subscription.create({
          paypalSubscriptionId: paypalSubId,
          userId: null,
          planId: null,
          status: 'incomplete',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date()
        });
        return res.json({ ok: true });
      }
      if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
        sub.status = 'active';
        sub.currentPeriodStart = new Date(
          resource?.billing_info?.last_payment?.time || event.create_time || Date.now()
        );
        sub.currentPeriodEnd = new Date(resource?.billing_info?.next_billing_time || Date.now());
        sub.cancelAtPeriodEnd = false;
      } else if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
        sub.status = 'canceled';
      } else if (eventType === 'BILLING.SUBSCRIPTION.SUSPENDED') {
        sub.status = 'paused';
      } else if (eventType === 'BILLING.SUBSCRIPTION.RE-ACTIVATED') {
        sub.status = 'active';
      } else if (
        eventType === 'BILLING.SUBSCRIPTION.UPDATED' ||
        eventType === 'BILLING.SUBSCRIPTION.RENEWED'
      ) {
        // Period advanced
        if (resource?.billing_info?.next_billing_time) {
          sub.currentPeriodEnd = new Date(resource.billing_info.next_billing_time);
        }
      }
      await sub.save();
      return res.json({ ok: true });
    }

    // For legacy order events, just ack
    await WebhookEvent.create({ provider: 'paypal', eventId });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

module.exports = router;
