const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const updatesController = require('../../modules/admin/updates/updates.controller');

const router = express.Router();

const updatesRateLimiter = createRateLimiter(100, 15 * 60 * 1000);
router.use(updatesRateLimiter);

router.get('/check', requireAdmin, updatesController.checkUpdates);

module.exports = router;
