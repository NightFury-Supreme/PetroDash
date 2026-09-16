const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');

const User = require('../models/User');
const { getSettings } = require('../lib/settings');

const router = express.Router();

// GET /api/payments - list my completed payments (most recent first)
router.get('/', requireAuth, async (req, res) => {
  try {
    const paginate = String(req.query.paginate || '').toLowerCase() === 'true';
    let page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
    let pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize || '20')) || 20));

    const { getCache, setCache } = require('../lib/redis');
    const cacheKey = `payments:mine:${req.user.sub}:${paginate ? `p${page}:s${pageSize}` : 'all'}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let userId;
    try { userId = new mongoose.Types.ObjectId(String(req.user.sub)); } catch { userId = req.user.sub; }

    // Only show actionable or completed/voided payments to the user - hide abandoned checkouts (CREATED) until they are voided
    const baseQuery = { 
      userId,
      status: { $in: ['COMPLETED', 'FAILED', 'REFUNDED', 'VOIDED'] }
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
    // Non-blocking cache write
    setCache(cacheKey, responsePayload, 30).catch(() => {});

    res.json(responsePayload);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET /api/payments/:id/invoice - PDF invoice download (only for COMPLETED)
router.get('/:id/invoice', requireAuth, createRateLimiter(5, 60 * 1000), async (req, res) => {
  try {
    const p = await Payment.findOne({ _id: String(req.params.id), userId: req.user.sub, status: 'COMPLETED' }).lean();
    if (!p) return res.status(404).json({ error: 'Invoice not found' });
    const plan = await Plan.findById(p.planId).lean();
    const user = await User.findById(p.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${p._id}.pdf"`);

    const settings = await getSettings();
    const { generateInvoicePdfBuffer } = require('../lib/invoicePdf');
    
    let frontendHost = process.env.FRONTEND_URL || req.get('host');
    const protocol = req.protocol || 'https';
    
    const pdfBuffer = await generateInvoicePdfBuffer(p, plan, user, settings, frontendHost, protocol);
    
    res.send(pdfBuffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
