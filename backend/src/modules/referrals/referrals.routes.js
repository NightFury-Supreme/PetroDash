/**
 * Referrals Routing Layer
 */

const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const referralsController = require('./referrals.controller');

const router = express.Router();

router.get('/me', requireAuth, referralsController.getMyStats);
router.get('/list', requireAuth, referralsController.getReferredUsersList);
router.post('/code', requireAuth, referralsController.setCustomCode);

module.exports = router;
