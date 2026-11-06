const Plan = require('../models/Plan');
const User = require('../models/User');
const UserPlan = require('../models/UserPlan');
const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');
const { writeAudit } = require('../middleware/audit');
const { sendMailTemplate } = require('./mail');
const { deleteCachePattern } = require('./redis');

async function processCapturedPayment(payment, captureData, sanitizedOrderId) {
  const isFree = payment.provider === 'system' && payment.amount === 0;

  if (!isFree) {
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
      return { success: false, error: 'Payment mismatch — order rejected for security' };
    }
  }

  const plan = await Plan.findById(payment.planId).lean();
  if (!plan) {
    await Payment.findByIdAndUpdate(payment._id, { status: 'FAILED' });
    return { success: false, error: 'Plan not found' };
  }

  const nowCapture = new Date();
  const activeCondition = {
    status: 'active',
    $or: [
      { isLifetime: true },
      { expiresAt: null },
      { expiresAt: { $gt: nowCapture } }
    ]
  };

  if (plan.stock > 0) {
    const purchasedCount = await UserPlan.countDocuments({
      planId: { $eq: plan._id },
      ...activeCondition
    });
    if (purchasedCount >= plan.stock) {
      await Payment.findByIdAndUpdate(payment._id, { status: 'REFUND_REQUIRED' });
      return { success: false, error: isFree ? 'Plan is out of stock' : 'Plan is out of stock (payment captured, refund required)' };
    }
  }

  if (plan.limitPerCustomer > 0) {
    const userPurchases = await UserPlan.countDocuments({
      userId: { $eq: payment.userId },
      planId: { $eq: plan._id },
      ...activeCondition
    });
    if (userPurchases >= plan.limitPerCustomer) {
      await Payment.findByIdAndUpdate(payment._id, { status: 'REFUND_REQUIRED' });
      return { success: false, error: isFree ? 'You have reached the purchase limit for this plan' : 'You have reached the purchase limit for this plan (payment captured, refund required)' };
    }
  }

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
    return { success: true, alreadyProcessed: true, order: captureData, user };
  }

  const paymentMeta = claimedPayment.meta || {};
  let changes = {};
  
  const activityReq = {
    ip: paymentMeta.ip || 'unknown',
    headers: {
      'user-agent': paymentMeta.userAgent || 'unknown',
      'x-forwarded-for': paymentMeta.ip || undefined
    },
    get: (header) => header.toLowerCase() === 'user-agent' ? (paymentMeta.userAgent || 'unknown') : null
  };

  const amountStr = `${claimedPayment.amount} ${claimedPayment.currency || 'USD'}`;

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

  const pc = plan.productContent || {};
  const rr = pc.recurrentResources || {};
  const flatResources = {
    cpuPercent: rr.cpuPercent || 0,
    memoryMb: rr.memoryMb || 0,
    diskMb: rr.diskMb || 0,
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
    const coinBonus = Number(pc.coins || 0);

    if (coinBonus > 0) {
      const updatedUser = await User.findByIdAndUpdate(
        user._id, 
        { $inc: { coins: coinBonus } }, 
        { new: true }
      );
      if (updatedUser) {
        changes.coins = { old: user.coins, new: updatedUser.coins };
        user.coins = updatedUser.coins;
      }
    }

    sub.benefitsApplied = true;
    await sub.save();

    if (paymentMeta.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: paymentMeta.couponCode.toUpperCase() },
        { $inc: { redeemedCount: 1 } }
      );
      await deleteCachePattern('admin:coupons:list:*');
    }
  }

  const userPubId = user.publicId;
  const paymentPubId = claimedPayment.publicId;
  const planPubId = plan.publicId;

  await writeAudit(userPubId, 'payment.purchase.completed', 'payment', paymentPubId, {
    provider: claimedPayment.provider,
    planId: planPubId,
    planName: plan.name,
    amount: claimedPayment.amount,
    currency: claimedPayment.currency,
    billingCycle: paymentMeta.billingCycle,
    isLifetime: paymentMeta.isLifetime,
    orderId: sanitizedOrderId,
    userId: userPubId,
    changes
  });
  
  const { logUserActivity } = require('../middleware/userActivity');
  await logUserActivity(activityReq, 'payment.purchase.completed', { 
    planName: plan.name, 
    amount: amountStr,
    changes
  }, userPubId);

  const { deleteCache } = require('./redis');
  const { invalidateUserCaches, invalidateUserPaymentsCaches } = require('../utils/userCacheInvalidation');
  await Promise.allSettled([
    invalidateUserPaymentsCaches(userPubId),
    invalidateUserCaches(userPubId),
    deleteCache('admin:ledger'),
  ]);

  try {
    const freshUser = await User.findById(payment.userId).lean();
    if (freshUser?.email) {
      const { getSettings } = require('./settings');
      const settings = await getSettings();
      const { generateInvoicePdfBuffer } = require('./invoicePdf');
      const frontendHost = process.env.FRONTEND_URL || '';
      
      const pdfBuffer = await generateInvoicePdfBuffer(payment, plan, freshUser, settings, frontendHost, 'https');
      
      const attachments = [{
        filename: `invoice-${paymentPubId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }];

      const currency = payment.currency || 'USD';
      const formatter = new Intl.NumberFormat(settings?.payments?.paypal?.currencyLocale || 'en-US', { style: 'currency', currency });
      const amountFormatted = formatter.format(payment.amount || 0);
      
      const displayInterval = payment.meta?.billingCycle 
        ? String(payment.meta.billingCycle).charAt(0).toUpperCase() + String(payment.meta.billingCycle).slice(1) 
        : (plan?.interval || 'One-time');

      const prefix = settings?.payments?.paypal?.invoicePrefix || 'INV-';
      const invoiceId = `${prefix}${String(paymentPubId).slice(-8).toUpperCase()}`;

      let frontendUrl = process.env.FRONTEND_URL || process.env.BACKEND_URL || '';
      if (frontendUrl && !frontendUrl.startsWith('http')) frontendUrl = `https://${frontendUrl}`;

      await sendMailTemplate({ 
        to: freshUser.email, 
        templateKey: 'planPurchased', 
        attachments,
        data: { 
          username: freshUser.username,
          planName: plan.name,
          planDescription: plan.description || '',
          amount: amountFormatted,
          interval: displayInterval,
          invoiceId: invoiceId,
          transactionId: payment.providerCaptureId || payment.providerOrderId || 'N/A',
          paymentMethod: String(payment.provider || '').charAt(0).toUpperCase() + String(payment.provider || '').slice(1),
          cpu: plan.productContent?.recurrentResources?.cpuPercent || 0,
          ram: plan.productContent?.recurrentResources?.memoryMb || 0,
          disk: plan.productContent?.recurrentResources?.diskMb || 0,
          databases: plan.productContent?.databases || 0,
          servers: plan.productContent?.serverLimit || 0,
          backups: plan.productContent?.backups || 0,
          frontendUrl
        } 
      });
    }
  } catch (_mailErr) {}

  return { success: true, order: captureData, user };
}

module.exports = { processCapturedPayment };
