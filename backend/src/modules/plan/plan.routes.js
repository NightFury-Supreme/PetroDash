/**
 * Plan Routes
 */

const express = require('express');
const planController = require('./plan.controller');

const router = express.Router();

router.get('/', planController.getPublicPlans);

module.exports = router;
