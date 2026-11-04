const express = require('express');
const statusController = require('./status.controller');

const router = express.Router();

router.get('/', (req, res, next) => statusController.getSystemStatus(req, res, next));
router.get('/stream', (req, res, next) => statusController.streamStatus(req, res, next));

module.exports = router;
