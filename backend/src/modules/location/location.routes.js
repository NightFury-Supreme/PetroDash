const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const locationController = require('./location.controller');

const router = express.Router();

router.get('/', requireAuth, (req, res, next) => locationController.getPublicLocations(req, res, next));

module.exports = router;
