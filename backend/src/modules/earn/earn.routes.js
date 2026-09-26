/**
 * Earn Routing Layer
 */

const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const earnController = require('./earn.controller');

const router = express.Router();

const earnRateLimiter = createRateLimiter(120, 15 * 60 * 1000);
router.use(earnRateLimiter);

router.get('/', requireAuth, earnController.getStatus.bind(earnController));
router.post('/:method/start', requireAuth, earnController.startSession.bind(earnController));
router.post('/:method/claim', requireAuth, earnController.claimSession.bind(earnController));

module.exports = router;
