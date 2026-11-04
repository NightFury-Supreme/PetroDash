const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const { activityController } = require('../modules/activity');

const router = express.Router();

const activityRateLimiter = createRateLimiter(100, 15 * 60 * 1000);
router.use('/', activityRateLimiter);

router.get('/', requireAuth, activityController.getUserActivity.bind(activityController));

module.exports = router;

