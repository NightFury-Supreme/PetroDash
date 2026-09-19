/**
 * Server Routing Layer
 */

const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const serverController = require('./server.controller');

const router = express.Router();

// Optimized Dashboard routes
router.get('/', requireAuth, serverController.listServers);
router.get('/usage', requireAuth, serverController.getUsage);

module.exports = router;
