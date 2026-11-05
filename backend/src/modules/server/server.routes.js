const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { validateObjectId } = require('../../middleware/validateObjectId');
const { createRateLimiter } = require('../../middleware/rateLimit');
const { getCache, deleteCache } = require('../../lib/redis');
const AppError = require('../../utils/AppError');
const serverController = require('./server.controller');

const router = express.Router();

async function streamAuth(req, res, next) {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return requireAuth(req, res, next);
  }

  const rawTicket = typeof req.query?.ticket === 'string' ? req.query.ticket.trim() : '';
  if (/^[a-zA-Z0-9_-]{16,64}$/.test(rawTicket)) {
    const ticketKey = `stream:ticket:${rawTicket}`;
    const cachedUser = await getCache(ticketKey);
    if (cachedUser) {
      await deleteCache(ticketKey);
      req.user = typeof cachedUser === 'object' ? cachedUser : { sub: cachedUser, userId: cachedUser };
      return next();
    }
  }

  return next(AppError.unauthorized('Unauthorized', 'ERR_UNAUTHORIZED'));
}

router.get('/', requireAuth, serverController.listServers.bind(serverController));
router.get('/usage', requireAuth, serverController.getUsage.bind(serverController));
router.get('/stream', streamAuth, serverController.streamEvents.bind(serverController));
router.post(
  '/stream/ticket',
  requireAuth,
  createRateLimiter(60, 60 * 1000),
  serverController.createStreamTicket.bind(serverController)
);

router.post(
  '/', 
  requireAuth, 
  createRateLimiter(5, 60 * 1000), 
  serverController.createServer.bind(serverController)
);

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
