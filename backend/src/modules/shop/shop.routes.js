/**
 * Shop Routing Layer
 * Declares endpoints, attaches authentication middleware, and wires controllers.
 */

const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const shopController = require('./shop.controller');

const router = express.Router();

router.get('/', requireAuth, shopController.getItems);
router.post('/purchase', requireAuth, shopController.purchaseItem);

module.exports = router;
