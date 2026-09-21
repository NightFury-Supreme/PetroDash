const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const { getSettingsHandler, updateSettingsHandler } = require('../../modules/admin/settings/settings.controller');

const router = express.Router();

// Rate limiting for settings endpoint
const settingsRateLimiter = createRateLimiter(50, 15 * 60 * 1000); // 50 requests per 15 minutes
router.use('/', settingsRateLimiter);

// GET /api/admin/settings
router.get('/', requireAdmin, getSettingsHandler);

// PATCH /api/admin/settings
router.patch('/', requireAdmin, updateSettingsHandler);

module.exports = router;
