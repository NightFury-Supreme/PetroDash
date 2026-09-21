const paymentsService = require('./payments.service');
const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');
const AppError = require('../../../utils/AppError');

exports.getLedger = async (req, res, next) => {
    try {
        const result = await paymentsService.getLedger(req.query);
        res.json(result);
    } catch (_error) {
        next(new AppError('Failed to fetch ledger', 500, 'ERR_INTERNAL'));
    }
};

exports.updatePayment = async (req, res, next) => {
    try {
        const { p, changes } = await paymentsService.updatePayment(req.params.id, req.body);
        await writeAudit(req, 'admin.payment.update', 'payment', p._id.toString(), { changes });
        res.json({ ok: true, payment: p });
    } catch (error) {
        next(error);
    }
};

exports.getInvoice = async (req, res, next) => {
    try {
        let frontendHost = process.env.FRONTEND_URL || req.get('host');
        const protocol = req.protocol || 'https';
        
        const { pdfBuffer, p } = await paymentsService.getInvoice(req.params.id, frontendHost, protocol);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${p._id}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};

exports.refundPayment = async (req, res, next) => {
    try {
        const { p, changes } = await paymentsService.refundPayment(req.params.id);
        
        await writeAudit(req, 'admin.payment.refund', 'payment', p._id.toString(), { providerCaptureId: p.providerCaptureId, changes });
        await logUserActivity(null, 'admin.payment.refund', { 
            paymentId: p._id.toString(), 
            planId: p.planId, 
            changes 
        }, p.userId.toString());

        res.json({ ok: true });
    } catch (error) {
        next(error);
    }
};

exports.voidPayment = async (req, res, next) => {
    try {
        const { p, changes } = await paymentsService.voidPayment(req.params.id);
        
        await writeAudit(req, 'admin.payment.void', 'payment', p._id.toString(), { changes });
        await logUserActivity(null, 'admin.payment.void', { 
            paymentId: p._id.toString(), 
            planId: p.planId, 
            changes 
        }, p.userId.toString());

        res.json({ ok: true });
    } catch (error) {
        next(error);
    }
};
