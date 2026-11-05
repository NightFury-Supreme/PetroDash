const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const paymentsController = require('../modules/payments');

const router = express.Router();

router.get('/', requireAuth, paymentsController.getPayments);

router.get('/:id/invoice', requireAuth, createRateLimiter(5, 60 * 1000), paymentsController.getInvoice);

module.exports = router;
