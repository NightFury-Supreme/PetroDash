const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const paymentsController = require('../../modules/admin/payments/payments.controller');

const router = express.Router();

router.get('/ledger', requireAdmin, paymentsController.getLedger);
router.patch('/:id', requireAdmin, paymentsController.updatePayment);
router.get('/:id/invoice', requireAdmin, paymentsController.getInvoice);
router.post('/:id/refund', requireAdmin, paymentsController.refundPayment);
router.post('/:id/void', requireAdmin, paymentsController.voidPayment);

module.exports = router;
