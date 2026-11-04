const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const { getLogsHandler } = require('../../modules/admin/logs');

const router = express.Router();

const logsRateLimiter = createRateLimiter(100, 15 * 60 * 1000);
router.use('/', logsRateLimiter);

router.get('/', requireAdmin, getLogsHandler);

module.exports = router;

