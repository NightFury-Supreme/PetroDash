/**
 * Gift Routing Layer
 */

const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const giftController = require('./gift.controller');

const router = express.Router();

router.post('/create', requireAuth, giftController.createGift);
router.get('/mine', requireAuth, giftController.getMyGifts);
router.post('/redeem', requireAuth, giftController.redeemGift);

module.exports = router;
