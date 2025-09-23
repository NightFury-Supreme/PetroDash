const express = require('express');
const { createRateLimiter } = require('../middleware/rateLimit');
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');
const Settings = require('../models/Settings');
const Plan = require('../models/Plan');
const User = require('../models/User');
const { writeAudit } = require('../middleware/audit');
const Payment = require('../models/Payment');
const jwt = require('jsonwebtoken');
const { getAccessToken } = require('../lib/paypal');
function resolveUserId(req) {
  // 1) Direct from middleware
  const direct = req?.user?.id || req?.user?._id || req.userId;
  if (direct) return String(direct);

  // 2) From Authorization header (accept standard and malformed formats)
  const authHeader = req.headers?.authorization || '';
  if (authHeader.toLowerCase().startsWith('bearer')) {
    const parts = authHeader.split(' ');
    const token = parts.length > 1 ? parts[1] : authHeader.slice(6).trim();
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        return String(
          payload?.id || payload?._id || payload?.userId || payload?.sub || payload?.user?.id || ''
        );
      } catch {
        try {
          const payload = jwt.decode(token);
          return String(
            payload?.id ||
              payload?._id ||
              payload?.userId ||
              payload?.sub ||
              payload?.user?.id ||
              ''
          );
        } catch {}
      }
    }
  }

  // 3) From cookie auth_token
  const cookie = req.headers?.cookie || '';
  const m = /(?:^|;\s*)auth_token=([^;]+)/.exec(cookie);
  if (m && m[1]) {
    const token = decodeURIComponent(m[1]);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      return String(
        payload?.id || payload?._id || payload?.userId || payload?.sub || payload?.user?.id || ''
      );
    } catch {
      try {
        const payload = jwt.decode(token);
        return String(
          payload?.id || payload?._id || payload?.userId || payload?.sub || payload?.user?.id || ''
        );
      } catch {}
    }
  }

  return null;
}

const router = express.Router();

async function getPaypalConfig() {
  const { token, baseUrl, paypal, settings } = await getAccessToken();
  if (!paypal.enabled) throw new Error('PayPal is disabled');
  return { paypal, baseUrl, token, settings };
}

router.get('/test', requireAuth, async(req, res) => {
  try {
    await getAccessToken();
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message, needsConfiguration: true });
  }
});

router.post('/create-order', requireAuth, createRateLimiter(10, 60 * 1000), async(req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      const hasAuth = !!req.headers?.authorization;
      return res
        .status(401)
        .json({
          error: hasAuth
            ? 'Unauthorized: token invalid or missing id claim'
            : 'Unauthorized: missing Authorization header'
        });
    }
    const { planId, billingCycle = 'monthly', couponCode } = req.body || {};
    if (!planId) return res.status(400).json({ error: 'planId is required' });

    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(planId)) {
      return res.status(400).json({ error: 'Invalid plan ID format' });
    }

    const plan = await Plan.findById(planId).lean();
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    // Calculate final price
    let finalPrice = plan.pricePerMonth;
    if (billingCycle === 'lifetime') {
      finalPrice = plan.pricePerMonth; // Lifetime plans use the monthly price as one-time payment
    } else if (billingCycle === 'quarterly') {
      finalPrice = plan.pricePerMonth * 3;
    } else if (billingCycle === 'semi-annual') {
      finalPrice = plan.pricePerMonth * 6;
    } else if (billingCycle === 'annual') {
      finalPrice = plan.pricePerMonth * 12;
    }

    // Apply coupon discount if provided
    let discountAmount = 0;
    if (couponCode) {
      const Coupon = require('../models/Coupon');
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        enabled: true
      });

      if (coupon) {
        if (coupon.type === 'percentage') {
          discountAmount = (finalPrice * coupon.value) / 100;
        } else {
          discountAmount = coupon.value;
        }
      }
    }

    finalPrice = Math.max(0, finalPrice - discountAmount);

    const { token, baseUrl, paypal } = await getAccessToken();
    const amount = Number(finalPrice).toFixed(2);
    const createBody = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: String(plan._id),
          amount: { currency_code: paypal.currency || 'USD', value: amount },
          description: `${plan.name} (${plan.billingOptions?.lifetime ? 'Lifetime' : billingCycle})`
        }
      ],
      application_context: {
        brand_name: 'PteroDash',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/plan/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/plan/cancel`
      }
    };

    const r = await axios.post(`${baseUrl}/v2/checkout/orders`, createBody, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const order = r.data;

    // Record intent
    await Payment.create({
      provider: 'paypal',
      providerOrderId: order.id,
      userId,
      planId: plan._id,
      amount: Number(finalPrice || 0),
      currency: paypal.currency || 'USD',
      status: 'CREATED',
      meta: {
        billingCycle,
        couponCode,
        discountAmount,
        isLifetime: plan.billingOptions?.lifetime || false
      }
    });

    res.json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/capture-order', requireAuth, createRateLimiter(10, 60 * 1000), async(req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      const hasAuth = !!req.headers?.authorization;
      return res
        .status(401)
        .json({
          error: hasAuth
            ? 'Unauthorized: token invalid or missing id claim'
            : 'Unauthorized: missing Authorization header'
        });
    }
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    // Validate orderId to prevent SSRF attacks
    // PayPal order IDs are typically alphanumeric with hyphens and underscores
    const sanitizedOrderId = String(orderId).trim();
    if (!/^[A-Z0-9_-]+$/i.test(sanitizedOrderId)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    // Additional length validation (PayPal order IDs are typically 17-20 characters)
    if (sanitizedOrderId.length < 10 || sanitizedOrderId.length > 50) {
      return res.status(400).json({ error: 'Invalid order ID length' });
    }

    const { token, baseUrl } = await getAccessToken();

    const r = await axios.post(
      `${baseUrl}/v2/checkout/orders/${encodeURIComponent(sanitizedOrderId)}/capture`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const data = r.data;

    const refUnit = data?.purchase_units?.[0];
    const planId = refUnit?.reference_id;
    const plan = planId ? await Plan.findById(planId) : null;

    // Order/payment validation and ownership checks
    const payment = await Payment.findOne({ provider: 'paypal', providerOrderId: data.id });
    if (!payment) {
      return res.status(400).json({ error: 'Unknown order' });
    }
    if (String(payment.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const expectedAmount = Number(payment.amount).toFixed(2);
    const expectedCurrency = (payment.currency || 'USD').toUpperCase();
    const capture = refUnit?.payments?.captures?.[0];
    const gotAmount = String((capture?.amount?.value ?? refUnit?.amount?.value) || '');
    const gotCurrency = String(
      (capture?.amount?.currency_code ?? refUnit?.amount?.currency_code) || ''
    ).toUpperCase();
    const normGotAmount = isNaN(parseFloat(gotAmount))
      ? ''
      : Number(parseFloat(gotAmount)).toFixed(2);
    if (
      normGotAmount !== expectedAmount ||
      gotCurrency !== expectedCurrency ||
      String(payment.planId) !== String(planId)
    ) {
      payment.status = 'FAILED';
      await payment.save();
      return res.status(400).json({ error: 'Order mismatch' });
    }
    if (!plan) {
      payment.status = 'FAILED';
      await payment.save();
      return res.status(404).json({ error: 'Plan not found' });
    }
    const orderStatus = String(data?.status || '').toUpperCase();
    if (orderStatus !== 'COMPLETED') {
      payment.status = 'FAILED';
      await payment.save();
      return res.status(400).json({ error: `Order not completed (${orderStatus})` });
    }

    let updatedUser = null;
    const user = await User.findById(userId);
    // Idempotency
    if (payment.status === 'COMPLETED') {
      return res.json({
        ok: true,
        order: data,
        user: { coins: user?.coins, limits: user?.limits }
      });
    }
    if (user) {
      // Update payment record first
      payment.status = 'COMPLETED';
      payment.providerCaptureId =
        data?.purchase_units?.[0]?.payments?.captures?.[0]?.id || undefined;
      await payment.save();

      // Get payment metadata for logging
      const paymentMeta = payment.meta || {};

      await writeAudit(req, 'payment.purchase.completed', 'payment', payment._id.toString(), {
        provider: 'paypal',
        planId: plan._id.toString(),
        planName: plan.name,
        amount: payment.amount,
        currency: payment.currency,
        billingCycle: paymentMeta.billingCycle,
        isLifetime: paymentMeta.isLifetime,
        orderId: orderId,
        userId: userId,
        purchaseDate: new Date().toISOString(),
        responsePreview: JSON.stringify({ status: data?.status })
      });

      // Send receipt email with PDF invoice
      try {
        const { sendMail } = require('../lib/mail');
        const Settings = require('../models/Settings');
        const settings = await Settings.findOne({}).lean();
        const brand = settings?.payments?.paypal?.businessName || settings?.siteName || 'PteroDash';
        const to = (await User.findById(userId).lean())?.email;
        if (to) {
          // Reuse invoice endpoint to generate PDF stream via axios
          const apiBase = process.env.API_BASE_URL || '';
          if (apiBase) {
            const axios = require('axios');
            const adminToken = req.headers.authorization; // assumes trusted path; otherwise generate system token
            const inv = await axios.get(`${apiBase}/api/payments/${payment._id}/invoice`, {
              headers: { Authorization: adminToken },
              responseType: 'arraybuffer'
            });
            await sendMail({
              to,
              subject: `${brand} Payment Receipt`,
              text: `Thank you for your purchase of ${plan.name}.`,
              html: `<p>Thank you for your purchase of <strong>${plan.name}</strong>.</p>`,
              attachments: [
                {
                  filename: `invoice-${String(payment._id).slice(-8)}.pdf`,
                  content: Buffer.from(inv.data),
                  contentType: 'application/pdf'
                }
              ]
            });
          }
        }
      } catch (_) {}
      // Also send plan purchased template (non-blocking)
      try {
        const { sendMailTemplate } = require('../lib/mail');
        const u = await User.findById(userId).lean();
        if (u?.email) {
          await sendMailTemplate({
            to: u.email,
            templateKey: 'planPurchased',
            data: { planName: plan.name }
          });
        }
      } catch (_) {}

      // Ensure a UserPlan record exists/extends for this user and plan
      const UserPlan = require('../models/UserPlan');
      const billingCycle = paymentMeta.billingCycle || 'monthly';
      const isLifetime = paymentMeta.isLifetime || false;

      // Calculate duration based on billing cycle
      let monthsToAdd = 1;
      if (billingCycle === 'quarterly') monthsToAdd = 3;
      else if (billingCycle === 'semi-annual') monthsToAdd = 6;
      else if (billingCycle === 'annual') monthsToAdd = 12;

      // Always create a new UserPlan record for each purchase
      const now = new Date();
      let expiresAt = null;

      if (isLifetime) {
        // Lifetime plans don't expire
        expiresAt = null;
      } else {
        expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + monthsToAdd);
      }

      const sub = await UserPlan.create({
        userId,
        planId: plan._id,
        purchaseDate: now,
        expiresAt,
        status: 'active',
        billingCycle,
        isLifetime,
        resources: plan.productContent,
        amount: payment.amount
      });

      // Apply one-time benefits if not already applied for this subscription
      if (sub && !sub.benefitsApplied) {
        const productContent = plan.productContent || {};

        // Add coins to user
        user.coins = Number(user.coins || 0) + Number(productContent.coins || 0);

        // Add all resources to user resources
        if (!user.resources) user.resources = {};

        // Add recurrent resources (monthly benefits)
        const recurrentResources = productContent.recurrentResources || {};
        user.resources.diskMb =
          Number(user.resources.diskMb || 0) + Number(recurrentResources.diskMb || 0);
        user.resources.memoryMb =
          Number(user.resources.memoryMb || 0) + Number(recurrentResources.memoryMb || 0);
        user.resources.cpuPercent =
          Number(user.resources.cpuPercent || 0) + Number(recurrentResources.cpuPercent || 0);

        // Add additional resources (one-time benefits)
        user.resources.backups =
          Number(user.resources.backups || 0) + Number(productContent.backups || 0);
        user.resources.databases =
          Number(user.resources.databases || 0) + Number(productContent.databases || 0);
        user.resources.allocations =
          Number(user.resources.allocations || 0) +
          Number(productContent.additionalAllocations || 0);
        user.resources.serverSlots =
          Number(user.resources.serverSlots || 0) + Number(productContent.serverLimit || 0);

        await user.save();

        // Mark benefits as applied
        sub.benefitsApplied = true;
        await sub.save();

        // Update coupon usage if used
        if (paymentMeta.couponCode) {
          const Coupon = require('../models/Coupon');
          await Coupon.findOneAndUpdate(
            { code: paymentMeta.couponCode.toUpperCase() },
            { $inc: { redeemedCount: 1 } }
          );
        }

        updatedUser = { coins: user.coins, resources: user.resources };
      } else {
        updatedUser = { coins: user.coins, resources: user.resources };
      }
    }

    res.json({ ok: true, order: data, user: updatedUser });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
