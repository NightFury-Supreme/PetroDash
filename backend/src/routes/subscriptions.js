const express = require('express');
const { createRateLimiter } = require('../middleware/rateLimit');
const { requireAuth } = require('../middleware/auth');
const controller = require('../modules/subscriptions/subscriptions.controller');

const listLimiter = createRateLimiter(30, 60 * 1000, { prefix: 'rl:sub:list:' });
const createLimiter = createRateLimiter(5, 60 * 1000, { prefix: 'rl:sub:create:' });
const actionLimiter = createRateLimiter(10, 60 * 1000, { prefix: 'rl:sub:action:' });

const router = express.Router();

router.use(listLimiter);

router.get('/', requireAuth, listLimiter, controller.list.bind(controller));
router.post('/', requireAuth, createLimiter, controller.create.bind(controller));
router.post('/confirm', requireAuth, actionLimiter, controller.confirm.bind(controller));
router.post('/:id/pause', requireAuth, actionLimiter, controller.pause.bind(controller));
router.post('/:id/resume', requireAuth, actionLimiter, controller.resume.bind(controller));
router.post('/:id/upgrade', requireAuth, createLimiter, controller.upgrade.bind(controller));
router.post('/:id/cancel', requireAuth, createLimiter, controller.cancel.bind(controller));

module.exports = router;
