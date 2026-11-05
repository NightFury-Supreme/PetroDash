const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const statsController = require('../../modules/admin/stats/stats.controller');

const router = express.Router();

router.get('/', requireAdmin, statsController.getStats);

module.exports = router;
