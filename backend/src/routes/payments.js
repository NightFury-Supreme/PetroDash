const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const PDFDocument = require('pdfkit');
const Settings = require('../models/Settings');

const router = express.Router();

// GET /api/payments - list my completed payments (most recent first)
router.get('/', requireAuth, async (req, res) => {
  try {
    const paginate = String(req.query.paginate || '').toLowerCase() === 'true';
    let page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
    let pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize || '20')) || 20));
    const baseQuery = { userId: req.user.sub, status: 'COMPLETED' };
    let q = Payment.find(baseQuery).sort({ createdAt: -1 }).lean();
    if (paginate) q = q.skip((page - 1) * pageSize).limit(pageSize);
    const [list, total] = await Promise.all([
      q,
      paginate ? Payment.countDocuments(baseQuery) : Promise.resolve(0)
    ]);
    const planIds = [...new Set(list.map(p => String(p.planId)).filter(Boolean))];
    const plans = await Plan.find({ _id: { $in: planIds } }, { name: 1, interval: 1 }).lean();
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
    if (paginate) {
      return res.json({ data: out, meta: { total, page, pageSize } });
    }
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET /api/payments/:id/invoice - PDF invoice download (only for COMPLETED)
router.get('/:id/invoice', requireAuth, createRateLimiter(5, 60 * 1000), async (req, res) => {
  try {
    const p = await Payment.findOne({ _id: req.params.id, userId: req.user.sub, status: 'COMPLETED' }).lean();
    if (!p) return res.status(404).json({ error: 'Invoice not found' });
    const plan = await Plan.findById(p.planId).lean();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${p._id}.pdf"`);

    const settings = await Settings.findOne({}).lean();
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Header with logo and dashboard name
    const brand = settings?.payments?.paypal?.businessName || settings?.siteName || 'PteroDash';
    const address = settings?.payments?.paypal?.businessAddress || '';
    const logoUrl = settings?.siteIconUrl;
    
    // Add logo if available
    if (logoUrl) {
      try {
        const axios = require('axios');
        const logoResponse = await axios.get(logoUrl, { responseType: 'arraybuffer' });
        const logoBuffer = Buffer.from(logoResponse.data);
        doc.image(logoBuffer, 50, 50, { width: 60, height: 60 });
        doc.text(brand, 120, 70, { fontSize: 20 });
      } catch (logoError) {
        console.warn('Failed to load logo for invoice:', logoError.message);
        doc.fontSize(20).text(brand, { align: 'left' });
      }
    } else {
      doc.fontSize(20).text(brand, { align: 'left' });
    }
    
    doc
      .moveDown(0.5)
      .fontSize(12)
      .fillColor('#666')
      .text('Invoice', { align: 'left' })
      .moveDown(0.25)
      .text(address)
      .fillColor('#000')
      .moveDown();

    // Meta
    const prefix = settings?.payments?.paypal?.invoicePrefix || 'INV-';
    const invoiceId = `${prefix}${String(p._id).slice(-8).toUpperCase()}`;
    const metaLeft = [
      `Invoice ID: ${invoiceId}`,
      `Date: ${new Date(p.createdAt).toLocaleString()}`,
    ];
    const metaRight = [
      `Provider: ${String(p.provider || '').toUpperCase()}`,
      `Order ID: ${p.providerOrderId}`,
    ];
    if (p.providerCaptureId) metaRight.push(`Capture ID: ${p.providerCaptureId}`);
    doc.fontSize(10);
    metaLeft.forEach((line, i) => doc.text(line, 50, 120 + i * 14));
    metaRight.forEach((line, i) => doc.text(line, 300, 120 + i * 14));

    // Divider
    doc.moveTo(50, 180).lineTo(545, 180).strokeColor('#ddd').stroke().strokeColor('#000');

    // Line items
    const yStart = 200;
    doc.fontSize(12).text('Plan', 50, yStart).text('Interval', 300, yStart).text('Amount', 470, yStart, { align: 'right' });
    doc.moveTo(50, yStart + 18).lineTo(545, yStart + 18).strokeColor('#eee').stroke().strokeColor('#000');

    const lineY = yStart + 30;
    doc.fontSize(11)
      .text(plan?.name || String(p.planId), 50, lineY)
      .text(plan?.interval || '-', 300, lineY)
      .text(`${p.amount.toFixed(2)} ${p.currency || 'USD'}`, 470, lineY, { align: 'right' });

    // Tax lines
    const taxRate = Number(settings?.payments?.paypal?.taxRatePercent || 0);
    let subtotal = Number(p.amount || 0);
    let tax = taxRate > 0 ? subtotal * (taxRate / 100) : 0;
    const currency = p.currency || 'USD';
    const formatter = new Intl.NumberFormat(settings?.payments?.paypal?.currencyLocale || 'en-US', { style: 'currency', currency });
    const ySub = lineY + 40;
    doc.fontSize(12)
      .text('Subtotal', 380, ySub)
      .text(formatter.format(subtotal), 470, ySub, { align: 'right' });
    if (tax > 0) {
      doc.text(settings?.payments?.paypal?.taxLabel || 'Tax', 380, ySub + 16)
         .text(formatter.format(subtotal + tax), 470, ySub + 16, { align: 'right' });
    }
    doc.font('Helvetica-Bold')
      .text('Total', 380, ySub + (tax > 0 ? 32 : 16))
      .text(formatter.format(subtotal + tax), 470, ySub + (tax > 0 ? 32 : 16), { align: 'right' })
      .font('Helvetica');

    // Footer
    doc.fontSize(10).fillColor('#666').text('Thank you for your purchase.', 50, 720, { align: 'center', width: 495 });

    doc.end();
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;


