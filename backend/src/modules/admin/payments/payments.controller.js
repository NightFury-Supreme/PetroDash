/**
 * Admin Payments Controller
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

const paymentsService = require('./payments.service');
const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');
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
      throw new AppError('Invalid query parameters', 400, 'ERR_LEDGER_QUERY_INVALID', parsed.error.flatten());
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
      throw new AppError('Invalid payment ID format', 400, 'ERR_INVALID_ID', paramParsed.error.flatten());
    }
    const parsed = updatePaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid payment payload', 400, 'ERR_PAYMENT_VALIDATION_FAILED', parsed.error.flatten());
    }
    const { p, changes } = await paymentsService.updatePayment(paramParsed.data.id, parsed.data);
    await writeAudit(req, 'admin.payment.update', 'payment', p._id.toString(), { changes });
    await logUserActivity(req, 'admin.payment.update', {
      paymentId: p._id.toString(),
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    });
    return res.json({ ok: true, payment: p });
  } catch (error) {
    next(error);
  }
};

const getInvoice = async (req, res, next) => {
  try {
    const paramParsed = paymentIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new AppError('Invalid payment ID format', 400, 'ERR_INVALID_ID', paramParsed.error.flatten());
    }
    const frontendHost = process.env.FRONTEND_URL || req.get('host');
    const protocol = req.protocol || 'https';

    const { pdfBuffer, p } = await paymentsService.getInvoice(paramParsed.data.id, frontendHost, protocol);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${p._id}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

const refundPayment = async (req, res, next) => {
  try {
    const paramParsed = paymentIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new AppError('Invalid payment ID format', 400, 'ERR_INVALID_ID', paramParsed.error.flatten());
    }
    const { p, changes } = await paymentsService.refundPayment(paramParsed.data.id);

    await writeAudit(req, 'admin.payment.refund', 'payment', p._id.toString(), { providerCaptureId: p.providerCaptureId, changes });
    await logUserActivity(
      null,
      'admin.payment.refund',
      {
        paymentId: p._id.toString(),
        planId: p.planId,
        changes,
      },
      p.userId.toString()
    );

    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

const voidPayment = async (req, res, next) => {
  try {
    const paramParsed = paymentIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new AppError('Invalid payment ID format', 400, 'ERR_INVALID_ID', paramParsed.error.flatten());
    }
    const { p, changes } = await paymentsService.voidPayment(paramParsed.data.id);

    await writeAudit(req, 'admin.payment.void', 'payment', p._id.toString(), { changes });
    await logUserActivity(
      null,
      'admin.payment.void',
      {
        paymentId: p._id.toString(),
        planId: p.planId,
        changes,
      },
      p.userId.toString()
    );

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
