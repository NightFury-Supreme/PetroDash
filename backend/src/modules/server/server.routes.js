/**
 * Server Routing Layer
 * Declares all server endpoints with authentication and rate limiting.
 */

const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { validateObjectId } = require('../../middleware/validateObjectId');
const { createRateLimiter } = require('../../middleware/rateLimit');
const serverController = require('./server.controller');

const router = express.Router();

// Dashboard queries
router.get('/', requireAuth, serverController.listServers.bind(serverController));
router.get('/usage', requireAuth, serverController.getUsage.bind(serverController));

// Server creation
router.post(
  '/', 
  requireAuth, 
  createRateLimiter(5, 60 * 1000), 
  serverController.createServer.bind(serverController)
);

// Single server operations
router.get(
  '/:id', 
  requireAuth, 
  validateObjectId('id'), 
  serverController.getServer.bind(serverController)
);

router.patch(
  '/:id', 
  requireAuth, 
  validateObjectId('id'), 
  createRateLimiter(20, 60 * 1000), 
  serverController.updateServer.bind(serverController)
);

router.delete(
  '/:id', 
  requireAuth, 
  validateObjectId('id'), 
  createRateLimiter(10, 60 * 1000), 
  serverController.deleteServer.bind(serverController)
);

module.exports = router;
