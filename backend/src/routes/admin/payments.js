const express = require('express');
const axios = require('axios');
const { requireAdmin } = require('../../middleware/auth');
const Payment = require('../../models/Payment');
 
const { getAccessToken } = require('../../lib/paypal');

const router = express.Router();


// GET /api/admin/ledger - list payments with filters
router.get('/ledger', requireAdmin, async (req, res) => {
  try {
    const { status, provider, userId, page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const q = {};
    if (status && ['pending', 'completed', 'failed', 'refunded'].includes(status)) {
      q.status = { $eq: status };
    }
    if (provider && ['paypal', 'stripe', 'coinbase'].includes(provider)) {
      q.provider = { $eq: provider };
    }
    if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
      q.userId = { $eq: userId };
    }

    const { getCache, setCache } = require('../../lib/redis');
    const cacheKey = `admin:ledger:${status || ''}:${provider || ''}:${userId || ''}:${pageNum}:${limitNum}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);
    
    const total = await Payment.countDocuments(q);
    const list = await Payment.find(q)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();
      
    const result = {
      payments: list,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };

    await setCache(cacheKey, result, 30);
    res.json(result);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ledger' });
  }
});

// PATCH /api/admin/payments/:id - update payment details
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, amount, currency } = req.body;
    const p = await Payment.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Payment not found' });
    
    // Update allowed fields
    if (status !== undefined) p.status = status;
    if (amount !== undefined) p.amount = amount;
    if (currency !== undefined) p.currency = currency;
    
    await p.save();

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:ledger');

    res.json({ ok: true, payment: p });
  } catch (e) { 
    res.status(400).json({ error: e.message }); 
  }
});

// POST /api/admin/payments/:id/refund
router.post('/:id/refund', requireAdmin, async (req, res) => {
  try {
    const p = await Payment.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    if (p.provider !== 'paypal') return res.status(400).json({ error: 'Only PayPal supported' });
    const { token, baseUrl } = await getAccessToken();
    // Refund by capture id when available
    const captureId = p.providerCaptureId;
    if (!captureId) return res.status(400).json({ error: 'No capture id to refund' });
    await axios.post(`${baseUrl}/v2/payments/captures/${captureId}/refund`, {}, { headers: { Authorization: `Bearer ${token}` } });
    
    // Deduct resources and coins if payment was COMPLETED
    if (p.status === 'COMPLETED') {
      const Plan = require('../../models/Plan');
      const User = require('../../models/User');
      const UserPlan = require('../../models/UserPlan');

      const plan = await Plan.findById(p.planId);
      if (plan) {
        if (plan.type === 'coins') {
          await User.findByIdAndUpdate(p.userId, { $inc: { coins: -(Number(plan.coinsAmount) || 0) } });
        } else {
          const pc = plan.productContent || {};
          const rr = pc.recurrentResources || {};
          const decQuery = {
            coins: -(Number(pc.coins || 0)),
            'resources.diskMb': -(Number(rr.diskMb || 0)),
            'resources.memoryMb': -(Number(rr.memoryMb || 0)),
            'resources.cpuPercent': -(Number(rr.cpuPercent || 0)),
            'resources.backups': -(Number(pc.backups || 0)),
            'resources.databases': -(Number(pc.databases || 0)),
            'resources.allocations': -(Number(pc.additionalAllocations || 0)),
            'resources.serverSlots': -(Number(pc.serverLimit || 0)),
          };
          Object.keys(decQuery).forEach(k => { if (decQuery[k] === 0) delete decQuery[k]; });
          if (Object.keys(decQuery).length > 0) {
            await User.findByIdAndUpdate(p.userId, { $inc: decQuery });
          }
        }
      }
      
      // Mark latest active UserPlan as cancelled
      await UserPlan.findOneAndUpdate(
        { userId: p.userId, planId: p.planId, amount: p.amount, status: 'active' },
        { status: 'cancelled' },
        { sort: { purchaseDate: -1 } }
      );
    }

    p.status = 'REFUNDED';
    await p.save();

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:ledger');

    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST /api/admin/payments/:id/void
router.post('/:id/void', requireAdmin, async (req, res) => {
  try {
    const p = await Payment.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    if (p.provider !== 'paypal') return res.status(400).json({ error: 'Only PayPal supported' });
    // Voiding an order depends on status; in practice, treat as refund for captured, else mark voided
    if (p.status === 'COMPLETED') return res.status(400).json({ error: 'Use refund for completed payments' });
    p.status = 'VOIDED';
    await p.save();

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:ledger');

    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;



