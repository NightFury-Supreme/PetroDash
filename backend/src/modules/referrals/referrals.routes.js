const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const referralsController = require('./referrals.controller');

const router = express.Router();

router.get('/me', requireAuth, createRateLimiter(60, 60 * 1000, { prefix: 'rl:referrals:me:' }), referralsController.getMyStats);
router.get('/list', requireAuth, createRateLimiter(60, 60 * 1000, { prefix: 'rl:referrals:list:' }), referralsController.getReferredUsersList);
router.post('/code', requireAuth, createRateLimiter(10, 60 * 1000, { prefix: 'rl:referrals:code:' }), referralsController.setCustomCode);

module.exports = router;
