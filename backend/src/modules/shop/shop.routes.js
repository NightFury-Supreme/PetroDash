const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const shopController = require('./shop.controller');

const router = express.Router();
const purchaseLimiter = createRateLimiter(15, 60 * 1000, { prefix: 'rl:shop:purchase:' });

router.get('/', requireAuth, shopController.getItems);
router.post('/purchase', requireAuth, purchaseLimiter, shopController.purchaseItem);

module.exports = router;
