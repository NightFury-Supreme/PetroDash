/*
  Subscriptions Router
  Wires PayPal subscription endpoints to the subscriptions controller.
*/

const express = require('express');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { getClient } = require('../lib/redis');
const { requireAuth } = require('../middleware/auth');
const controller = require('../modules/subscriptions/subscriptions.controller');

const getStore = () => {
  const client = getClient();
  return client ? new RedisStore({ sendCommand: (...args) => client.call(...args) }) : undefined;
};

const listLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, store: getStore() });
const createLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, store: getStore() });
const actionLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, store: getStore() });

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
