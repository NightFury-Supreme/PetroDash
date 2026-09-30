const paymentsService = require('./payments.service');
const { querySchema, getInvoiceSchema } = require('./payments.schema');
const AppError = require('../../utils/AppError');

async function getPayments(req, res, next) {
  try {
    const query = querySchema.parse(req.query);
    const data = await paymentsService.getUserPayments(req.user.sub, query);
    res.json(data);
  } catch (e) {
    next(e instanceof AppError ? e : AppError.badRequest(e.message));
  }
}

async function getInvoice(req, res, next) {
  try {
    const params = getInvoiceSchema.parse(req.params);
    const frontendHost = process.env.FRONTEND_URL || req.get('host');
    const protocol = req.protocol || 'https';
    
    const { pdfBuffer, paymentId } = await paymentsService.getInvoicePdf(
      params.id,
      req.user.sub,
      req.user,
      frontendHost,
      protocol
    );
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${paymentId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error instanceof AppError ? error : AppError.badRequest(error.message));
  }
}

module.exports = {
  getPayments,
  getInvoice
};
