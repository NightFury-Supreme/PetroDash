const mongoose = require('mongoose');
const Payment = require('../../models/Payment');
const Plan = require('../../models/Plan');
const User = require('../../models/User');
const { getSettings } = require('../../lib/settings');
const { getCache, setCache } = require('../../lib/redis');
const { generateInvoicePdfBuffer } = require('../../lib/invoicePdf');
const AppError = require('../../utils/AppError');

async function getUserPayments(userId, query) {
  const paginate = String(query.paginate || '').toLowerCase() === 'true';
  let page = Math.max(1, parseInt(String(query.page || '1')) || 1);
  let pageSize = Math.max(1, Math.min(100, parseInt(String(query.pageSize || '20')) || 20));

  const cacheKey = `payments:mine:${userId}:${paginate ? `p${page}:s${pageSize}` : 'all'}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  let uid;
  try { uid = new mongoose.Types.ObjectId(String(userId)); } catch { uid = userId; }

  const baseQuery = {
    userId: uid,
    status: { $in: ['COMPLETED', 'FAILED', 'REFUNDED'] }
  };
  
  let q = Payment.find(baseQuery).sort({ createdAt: -1 }).lean();

  if (paginate) q = q.skip((page - 1) * pageSize).limit(pageSize);

  const [list, total] = await Promise.all([
    q,
    paginate ? Payment.countDocuments(baseQuery) : Promise.resolve(0)
  ]);
  
  const planIds = [...new Set(list.map(p => String(p.planId)).filter(Boolean))];
  const plans = planIds.length > 0
    ? await Plan.find({ _id: { $in: planIds } }, { name: 1, interval: 1 }).lean()
    : [];
  const planMap = new Map(plans.map(p => [String(p._id), p]));
  
  const out = list.map(p => ({
    id: String(p._id),
    provider: p.provider,
    providerOrderId: p.providerOrderId,
    providerCaptureId: p.providerCaptureId,
    planId: String(p.planId),
    plan: planMap.get(String(p.planId)) || null,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    createdAt: p.createdAt,
  }));

  const responsePayload = paginate ? { data: out, meta: { total, page, pageSize } } : out;
  setCache(cacheKey, responsePayload, 30).catch(() => {});

  return responsePayload;
}

async function getInvoicePdf(paymentId, userId, userContext, frontendHost, protocol) {
  const p = await Payment.findOne({
    _id: String(paymentId),
    userId: userId,
    status: { $in: ['COMPLETED', 'completed', 'PAID', 'paid'] }
  }).lean() || await Payment.findOne({ _id: String(paymentId), userId: userId }).lean();
  
  if (!p) throw AppError.notFound('ERR_INVOICE_NOT_FOUND');
  
  const plan = p.planId ? await Plan.findById(p.planId).lean() : null;
  let user = await User.findById(p.userId).lean();
  if (!user) {
    user = { username: userContext.username || '', email: userContext.email || '' };
  }

  const settings = await getSettings();
  const pdfBuffer = await generateInvoicePdfBuffer(p, plan, user, settings, frontendHost, protocol);
  
  return { pdfBuffer, paymentId: p._id };
}

module.exports = {
  getUserPayments,
  getInvoicePdf
};
