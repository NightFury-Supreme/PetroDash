/*
  Activity Router
  Wires user activity log endpoint to the activity controller.
*/

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const controller = require('../modules/activity/activity.controller');

const router = express.Router();

router.get('/', requireAuth, controller.getUserActivity.bind(controller));

module.exports = router;
