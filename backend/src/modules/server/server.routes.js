const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { validateObjectId } = require('../../middleware/validateObjectId');
const { createRateLimiter } = require('../../middleware/rateLimit');
const { getCache, deleteCache } = require('../../lib/redis');
const AppError = require('../../utils/AppError');
const serverController = require('./server.controller');

const router = express.Router();

async function streamAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return requireAuth(req, res, next);
  }

  const ticket = typeof req.query?.ticket === 'string' ? req.query.ticket : null;
  if (ticket) {
    const ticketKey = `stream:ticket:${ticket}`;
    const cachedUser = await getCache(ticketKey);
    if (!cachedUser) {
      return next(AppError.unauthorized('Invalid or expired stream ticket', 'ERR_INVALID_STREAM_TICKET'));
    }
    await deleteCache(ticketKey);
    req.user = typeof cachedUser === 'object' ? cachedUser : { sub: cachedUser, userId: cachedUser };
    return next();
  }

  const legacyToken = typeof req.query?.token === 'string' ? req.query.token : null;
  if (legacyToken) {
    req.headers.authorization = `Bearer ${legacyToken}`;
    return requireAuth(req, res, next);
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
