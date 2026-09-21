const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const { getLogsHandler } = require('../../modules/admin/logs/logs.controller');

const router = express.Router();

// Rate limiting for logs endpoint
const logsRateLimiter = createRateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes
router.use('/', logsRateLimiter);

// GET /api/admin/logs
router.get('/', requireAdmin, getLogsHandler);

module.exports = router;
