const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const giftController = require('./gift.controller');

const router = express.Router();

const createGiftLimiter = createRateLimiter(10, 60 * 1000, { prefix: 'rl:gift:create:' });
const redeemGiftLimiter = createRateLimiter(10, 60 * 1000, { prefix: 'rl:gift:redeem:' });
const mineGiftLimiter = createRateLimiter(60, 60 * 1000, { prefix: 'rl:gift:mine:' });

router.post('/create', requireAuth, createGiftLimiter, giftController.createGift);
router.get('/mine', requireAuth, mineGiftLimiter, giftController.getMyGifts);
router.post('/redeem', requireAuth, redeemGiftLimiter, giftController.redeemGift);

module.exports = router;
