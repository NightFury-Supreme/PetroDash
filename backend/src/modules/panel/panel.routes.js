const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const panelController = require('./panel.controller');

const router = express.Router();

router.get('/', requireAuth, createRateLimiter(100, 60 * 1000), panelController.getPanelInfo);
router.post('/reset', requireAuth, createRateLimiter(3, 5 * 60 * 1000), panelController.resetPassword);

module.exports = router;
