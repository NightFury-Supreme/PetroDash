/**
 * Admin Earn Routes
 */

const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const earnController = require('../../modules/admin/earn/earn.controller');

const router = express.Router();

router.get('/', requireAdmin, earnController.getSettings);
router.patch('/', requireAdmin, earnController.updateSettings);
router.get('/sessions', requireAdmin, earnController.getSessions);

module.exports = router;
