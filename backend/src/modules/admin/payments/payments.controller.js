const paymentsService = require('./payments.service');
const { writeAudit } = require('../../../middleware/audit');
const AppError = require('../../../utils/AppError');
const {
  paymentIdParamSchema,
  ledgerQuerySchema,
  updatePaymentSchema,
} = require('./payments.schema');

const getLedger = async (req, res, next) => {
  try {
    const parsed = ledgerQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid ledger query parameters', 'ERR_LEDGER_QUERY_INVALID', parsed.error.flatten());
    }
    const result = await paymentsService.getLedger(parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const updatePayment = async (req, res, next) => {
  try {
    const paramParsed = paymentIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw AppError.badRequest('Invalid payment ID format', 'ERR_INVALID_ID', paramParsed.error.flatten());
    }
    const parsed = updatePaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid payment payload', 'ERR_PAYMENT_VALIDATION_FAILED', parsed.error.flatten());
    }
    const { p, changes } = await paymentsService.updatePayment(paramParsed.data.id, parsed.data);
    const payId = p.publicId;
    await writeAudit(req, 'admin.payment.update', 'payment', payId, { changes });
    return res.json({ ok: true, payment: p });
  } catch (error) {
    next(error);
  }
};

const getInvoice = async (req, res, next) => {
  try {
    const paramParsed = paymentIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw AppError.badRequest('Invalid payment ID format', 'ERR_INVALID_ID', paramParsed.error.flatten());
    }
    const frontendHost = process.env.FRONTEND_URL || req.get('host');
    const protocol = req.protocol || 'https';

    const { pdfBuffer, p } = await paymentsService.getInvoice(paramParsed.data.id, frontendHost, protocol);
    const payId = p.publicId;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${payId}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

const refundPayment = async (req, res, next) => {
  try {
    const paramParsed = paymentIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw AppError.badRequest('Invalid payment ID format', 'ERR_INVALID_ID', paramParsed.error.flatten());
    }
    const { p, changes } = await paymentsService.refundPayment(paramParsed.data.id);
    const payId = p.publicId;

    await writeAudit(req, 'admin.payment.refund', 'payment', payId, {
      providerCaptureId: p.providerCaptureId,
      changes,
      targetUserId: p.userId?.publicId,
    });

    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

const voidPayment = async (req, res, next) => {
  try {
    const paramParsed = paymentIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw AppError.badRequest('Invalid payment ID format', 'ERR_INVALID_ID', paramParsed.error.flatten());
    }
    const { p, changes } = await paymentsService.voidPayment(paramParsed.data.id);
    const payId = p.publicId;

    await writeAudit(req, 'admin.payment.void', 'payment', payId, {
      changes,
      targetUserId: p.userId?.publicId,
    });

    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLedger,
  updatePayment,
  getInvoice,
  refundPayment,
  voidPayment,
};
