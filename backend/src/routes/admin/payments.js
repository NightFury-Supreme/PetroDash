const express = require('express');
const axios = require('axios');
const { requireAdmin } = require('../../middleware/auth');
const Payment = require('../../models/Payment');
const Settings = require('../../models/Settings');
const { getAccessToken } = require('../../lib/paypal');

const router = express.Router();

// GET /api/admin/ledger - list payments with filters
router.get('/ledger', requireAdmin, async (req, res) => {
  const { status, provider, userId } = req.query;
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
  const list = await Payment.find(q).sort({ createdAt: -1 }).limit(500).lean();
  res.json(list);
});

// PATCH /api/admin/payments/:id - update payment details
router.patch('/payments/:id', requireAdmin, async (req, res) => {
  try {
    const { status, amount, currency } = req.body;
    const p = await Payment.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Payment not found' });

    // Update allowed fields
    if (status !== undefined) p.status = status;
    if (amount !== undefined) p.amount = amount;
    if (currency !== undefined) p.currency = currency;

    await p.save();
    res.json({ ok: true, payment: p });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/admin/payments/:id/refund
router.post('/payments/:id/refund', requireAdmin, async (req, res) => {
  try {
    const p = await Payment.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    if (p.provider !== 'paypal') return res.status(400).json({ error: 'Only PayPal supported' });
    const { token, baseUrl } = await getAccessToken();
    // Refund by capture id when available
    const captureId = p.providerCaptureId;
    if (!captureId) return res.status(400).json({ error: 'No capture id to refund' });
    await axios.post(
      `${baseUrl}/v2/payments/captures/${captureId}/refund`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    p.status = 'REFUNDED';
    await p.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/admin/payments/:id/void
router.post('/payments/:id/void', requireAdmin, async (req, res) => {
  try {
    const p = await Payment.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    if (p.provider !== 'paypal') return res.status(400).json({ error: 'Only PayPal supported' });
    // Voiding an order depends on status; in practice, treat as refund for captured, else mark voided
    if (p.status === 'COMPLETED')
      return res.status(400).json({ error: 'Use refund for completed payments' });
    p.status = 'VOIDED';
    await p.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
