const Plan = require('../models/Plan');
const User = require('../models/User');
const UserPlan = require('../models/UserPlan');
const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');
const { writeAudit } = require('../middleware/audit');
const { sendMailTemplate } = require('./mail');

/**
 * Validates, claims, and processes a captured PayPal payment.
 * Applies resources, coins, handles auditing, and updates the payment.
 */
async function processCapturedPayment(payment, captureData, sanitizedOrderId) {
  const isFree = payment.provider === 'system' && payment.amount === 0;

  if (!isFree) {
    // Verify amounts match what we recorded (prevent price manipulation)
    const refUnit = captureData?.purchase_units?.[0];
    const capture = refUnit?.payments?.captures?.[0];
    const capturedAmount = Number(capture?.amount?.value ?? refUnit?.amount?.value ?? 0);
    const capturedCurrency = String(capture?.amount?.currency_code ?? refUnit?.amount?.currency_code ?? '').toUpperCase();
    const capturedPlanId = String(refUnit?.reference_id ?? '');

    if (
      Number(capturedAmount.toFixed(2)) !== Number(Number(payment.amount).toFixed(2)) ||
      capturedCurrency !== (payment.currency || 'USD').toUpperCase() ||
      capturedPlanId !== String(payment.planId)
    ) {
      await Payment.findByIdAndUpdate(payment._id, { status: 'FAILED' });
      console.error('[PayPal] Amount/currency/plan mismatch on capture', {
        expected: { amount: payment.amount, currency: payment.currency, planId: payment.planId },
        received: { amount: capturedAmount, currency: capturedCurrency, planId: capturedPlanId }
      });
      return { success: false, error: 'Payment mismatch — order rejected for security' };
    }
  }

  const plan = await Plan.findById(payment.planId).lean();
  if (!plan) {
    await Payment.findByIdAndUpdate(payment._id, { status: 'FAILED' });
    return { success: false, error: 'Plan not found' };
  }

  // Re-check TOCTOU Stock and Limits at capture time
  if (plan.stock > 0) {
    const purchasedCount = await UserPlan.countDocuments({ planId: { $eq: plan._id }, status: { $eq: 'active' } });
    if (purchasedCount >= plan.stock) {
      await Payment.findByIdAndUpdate(payment._id, { status: 'REFUND_REQUIRED' });
      return { success: false, error: isFree ? 'Plan is out of stock' : 'Plan is out of stock (payment captured, refund required)' };
    }
  }

  if (plan.limitPerCustomer > 0) {
    const userPurchases = await UserPlan.countDocuments({ userId: { $eq: payment.userId }, planId: { $eq: plan._id }, status: { $eq: 'active' } });
    if (userPurchases >= plan.limitPerCustomer) {
      await Payment.findByIdAndUpdate(payment._id, { status: 'REFUND_REQUIRED' });
      return { success: false, error: isFree ? 'You have reached the purchase limit for this plan' : 'You have reached the purchase limit for this plan (payment captured, refund required)' };
    }
  }

  // Atomically claim the payment — prevents double processing on concurrent requests
  const captureId = isFree ? payment.providerOrderId : captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
  const claimedPayment = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $ne: 'COMPLETED' } },
    { $set: { status: 'COMPLETED', providerCaptureId: captureId || undefined } },
    { new: true }
  );

  const user = await User.findById(payment.userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (!claimedPayment) {
    // Already processed by a prior/concurrent request — return current state idempotently
    return { success: true, alreadyProcessed: true, order: captureData, user };
  }

  // Write audit log using the userId context
  const paymentMeta = claimedPayment.meta || {};
  await writeAudit(payment.userId.toString(), 'payment.purchase.completed', 'payment', claimedPayment._id.toString(), {
    provider: claimedPayment.provider,
    planId: plan._id.toString(),
    planName: plan.name,
    amount: claimedPayment.amount,
    currency: claimedPayment.currency,
    billingCycle: paymentMeta.billingCycle,
    isLifetime: paymentMeta.isLifetime,
    orderId: sanitizedOrderId,
    userId: payment.userId.toString()
  });

  // Apply plan benefits
  const billingCycle = paymentMeta.billingCycle || 'monthly';
  const isLifetime = Boolean(paymentMeta.isLifetime);

  let monthsToAdd = 1;
  if (billingCycle === 'quarterly') monthsToAdd = 3;
  else if (billingCycle === 'semi-annual') monthsToAdd = 6;
  else if (billingCycle === 'annual') monthsToAdd = 12;

  const now = new Date();
  const expiresAt = isLifetime ? null : (() => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + monthsToAdd);
    return d;
  })();

  // Flatten resources for UserPlan snapshot
  const pc = plan.productContent || {};
  const rr = pc.recurrentResources || {};
  const flatResources = {
    cpuPercent: rr.cpuPercent || 0,
    memoryMb: rr.memoryMb || 0,
    diskMb: rr.diskMb || 0,
    swapMb: rr.swapMb !== undefined ? rr.swapMb : -1,
    blockIoProportion: rr.blockIoProportion || 0,
    cpuPinning: rr.cpuPinning || '',
    additionalAllocations: pc.additionalAllocations || 0,
    databases: pc.databases || 0,
    backups: pc.backups || 0,
    coins: pc.coins || 0,
    serverLimit: pc.serverLimit || 0
  };

  const sub = await UserPlan.create({
    userId: payment.userId,
    planId: plan._id,
    purchaseDate: now,
    expiresAt,
    status: 'active',
    billingCycle,
    isLifetime,
    resources: flatResources,
    amount: claimedPayment.amount
  });

  if (sub && !sub.benefitsApplied) {
    const pc = plan.productContent || {};
    const rr = pc.recurrentResources || {};

    // Atomically increment coins and resources to prevent TOCTOU lost updates
    const incQuery = {
      coins: Number(pc.coins || 0),
      'resources.diskMb': Number(rr.diskMb || 0),
      'resources.memoryMb': Number(rr.memoryMb || 0),
      'resources.cpuPercent': Number(rr.cpuPercent || 0),
      'resources.backups': Number(pc.backups || 0),
      'resources.databases': Number(pc.databases || 0),
      'resources.allocations': Number(pc.additionalAllocations || 0),
      'resources.serverSlots': Number(pc.serverLimit || 0),
    };

    // Clean up zero-increments
    Object.keys(incQuery).forEach(k => {
      if (incQuery[k] === 0) delete incQuery[k];
    });

    if (Object.keys(incQuery).length > 0) {
      const updatedUser = await User.findByIdAndUpdate(
        user._id, 
        { $inc: incQuery }, 
        { new: true }
      );
      if (updatedUser) {
        user.coins = updatedUser.coins;
        user.resources = updatedUser.resources;
      }
    }

    sub.benefitsApplied = true;
    await sub.save();

    // Increment coupon redemption count
    if (paymentMeta.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: paymentMeta.couponCode.toUpperCase() },
        { $inc: { redeemedCount: 1 } }
      );
    }
  }

  // Invalidate payment and user plans cache
  const { deleteCachePattern } = require('./redis');
  await deleteCachePattern(`payments:mine:${payment.userId}:*`);
  await deleteCachePattern(`user:${payment.userId}:plans`);
  await deleteCachePattern(`user:${payment.userId}:profile`); // Profile resources updated
  await deleteCachePattern('admin:ledger');

  // Send confirmation email (non-blocking, never fail the response)
  try {
    const freshUser = await User.findById(payment.userId).lean();
    if (freshUser?.email) {
      await sendMailTemplate({ to: freshUser.email, templateKey: 'planPurchased', data: { planName: plan.name } });
    }
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (_) {}

  return { success: true, order: captureData, user };
}

module.exports = { processCapturedPayment };
