const express = require('express');
const { requireAuth } = require('../middleware/auth');
const controller = require('../modules/userPlans/userPlans.controller');

const router = express.Router();

router.get('/', requireAuth, controller.getActivePlans.bind(controller));

module.exports = router;
