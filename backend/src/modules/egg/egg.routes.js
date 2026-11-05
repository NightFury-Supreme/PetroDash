const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const eggController = require('./egg.controller');

const router = express.Router();

router.get('/', requireAuth, (req, res, next) => eggController.getPublicEggs(req, res, next));

module.exports = router;
