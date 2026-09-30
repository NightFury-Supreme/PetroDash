const paymentsService = require('./payments.service');
const { querySchema, getInvoiceSchema } = require('./payments.schema');
const AppError = require('../../utils/AppError');

async function getPayments(req, res, next) {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid query parameters', 'ERR_INVALID_QUERY_PARAMS', parsed.error.flatten());
    }
    const data = await paymentsService.getUserPayments(req.user.sub, parsed.data);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function getInvoice(req, res, next) {
  try {
    const parsed = getInvoiceSchema.safeParse(req.params);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid payment ID format', 'ERR_INVALID_ID', parsed.error.flatten());
    }
    const frontendHost = process.env.FRONTEND_URL || req.get('host');
    const protocol = req.protocol || 'https';
    
    const { pdfBuffer, paymentId } = await paymentsService.getInvoicePdf(
      parsed.data.id,
      req.user.sub,
      req.user,
      frontendHost,
      protocol
    );
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${paymentId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPayments,
  getInvoice
};
