const Payment = require('../models/Payment');
const { logUserActivity } = require('../middleware/userActivity');
const { writeAudit } = require('../middleware/audit');
const { processCapturedPayment } = require('../lib/paymentProcessor');

const { PAYPAL_SUPPORTED_CURRENCIES } = require('../config/currencies');

function calcPrice(plan, billingCycle) {
  switch (billingCycle) {
    case 'quarterly':   return plan.pricePerMonth * 3;
    case 'semi-annual': return plan.pricePerMonth * 6;
    case 'annual':      return plan.pricePerMonth * 12;
    case 'lifetime':
    case 'monthly':
    default:            return plan.pricePerMonth;
  }
}

async function handleFreePlanOrder(req, res, { plan, billingCycle, couponCode, discountAmount, userId, siteCurrency, userSnapshot }) {
  const freeOrderId = `FREE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const payment = await Payment.create({
    provider: 'system',
    providerOrderId: freeOrderId,
    userId,
    planId: plan._id,
    amount: 0,
    currency: siteCurrency || 'USD',
    status: 'CREATED',
    meta: {
      billingCycle,
      couponCode: couponCode || null,
      discountAmount,
      isLifetime: billingCycle === 'lifetime' || Boolean(plan.billingOptions?.lifetime),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userSnapshot: userSnapshot || null,
    },
  });

  const AppError = require('../utils/AppError');
  const result = await processCapturedPayment(payment, null, freeOrderId);
  if (!result.success) {
    throw AppError.badRequest(result.error || 'Failed to process plan order', 'ERR_ORDER_PROCESSING_FAILED');
  }

  await logUserActivity(req, 'shop.payment.capture', { orderId: freeOrderId, status: 'COMPLETED', bypassPaypal: true });
  await writeAudit(req, 'shop.payment.capture', 'payment', payment.publicId, { orderId: freeOrderId, status: 'COMPLETED', bypassPaypal: true });
  return res.json({ id: freeOrderId, status: 'COMPLETED', bypassPaypal: true });
}

module.exports = {
  PAYPAL_SUPPORTED_CURRENCIES,
  calcPrice,
  handleFreePlanOrder,
};
