const Payment = require('../../models/Payment');
const Plan = require('../../models/Plan');
const User = require('../../models/User');
const { getSettings } = require('../../lib/settings');
const { getOrSetCache } = require('../../lib/redis');
const { generateInvoicePdfBuffer } = require('../../lib/invoicePdf');
const AppError = require('../../utils/AppError');
const { buildIdFilter } = require('../../utils/publicId');

async function getUserPayments(userId, query) {
  const paginate = String(query.paginate || '').toLowerCase() === 'true';
  let page = Math.max(1, parseInt(String(query.page || '1')) || 1);
  let pageSize = Math.max(1, Math.min(100, parseInt(String(query.pageSize || '20')) || 20));

  const cacheKey = `payments:mine:${userId}:${paginate ? `p${page}:s${pageSize}` : 'all'}`;

  return getOrSetCache(cacheKey, async () => {
    const user = await User.findOne(buildIdFilter(userId)).select('_id').lean();
    if (!user) return paginate ? { data: [], meta: { total: 0, page, pageSize } } : [];
    const uid = user._id;

    const baseQuery = {
      userId: uid,
      status: { $in: ['COMPLETED', 'FAILED', 'REFUNDED'] }
    };
    
    let q = Payment.find(baseQuery).sort({ createdAt: -1 }).populate('planId', 'name interval publicId').lean();

    if (paginate) q = q.skip((page - 1) * pageSize).limit(pageSize);

    const [list, total] = await Promise.all([
      q,
      paginate ? Payment.countDocuments(baseQuery) : Promise.resolve(0)
    ]);
    
    const out = list.map(p => {
      const planObj = p.planId && typeof p.planId === 'object' ? p.planId : null;
      return {
        id: p.publicId,
        provider: p.provider,
        providerOrderId: p.providerOrderId,
        providerCaptureId: p.providerCaptureId,
        planId: planObj?.publicId,
        plan: planObj ? { name: planObj.name, interval: planObj.interval, id: planObj.publicId } : null,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt,
      };
    });

    return paginate ? { data: out, meta: { total, page, pageSize } } : out;
  }, 30);
}

async function getInvoicePdf(paymentId, userId, userContext, frontendHost, protocol) {
  const userDoc = await User.findOne(buildIdFilter(userId)).select('_id username email').lean();
  if (!userDoc) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
  const uid = userDoc._id;

  const idFilter = buildIdFilter(paymentId);
  const p = await Payment.findOne({
    ...idFilter,
    userId: uid,
    status: { $in: ['COMPLETED', 'completed', 'PAID', 'paid'] }
  }).lean() || await Payment.findOne({ ...idFilter, userId: uid }).lean();
  
  if (!p) throw AppError.notFound('Invoice not found', 'ERR_INVOICE_NOT_FOUND');
  
  const plan = p.planId ? await Plan.findById(p.planId).lean() : null;
  let user = userDoc || (p.userId ? await User.findById(p.userId).lean() : null);
  if (!user && p.meta?.userSnapshot) {
    user = p.meta.userSnapshot;
  } else if (!user) {
    user = { username: userContext.username || '', email: userContext.email || '' };
  }

  const settings = await getSettings();
  const pdfBuffer = await generateInvoicePdfBuffer(p, plan, user, settings, frontendHost, protocol);
  
  return { pdfBuffer, paymentId: p.publicId };
}

module.exports = {
  getUserPayments,
  getInvoicePdf
};
