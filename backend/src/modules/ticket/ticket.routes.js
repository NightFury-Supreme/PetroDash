const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const ticketController = require('./ticket.controller');

const router = express.Router();

// Route: /api/tickets
router.post('/', requireAuth, createRateLimiter(5, 60 * 1000), ticketController.createTicket);
router.get('/categories', requireAuth, ticketController.getCategories);
router.get('/counts', requireAuth, ticketController.getCounts);
router.get('/mine', requireAuth, ticketController.getMine);
router.get('/mentions/search', requireAuth, ticketController.getMentionsSearch);

// ID-specific routes
router.get('/:id', requireAuth, ticketController.getTicketDetail);
router.get('/:id/messages', requireAuth, ticketController.getTicketMessages);
router.get('/:id/mentions', requireAuth, ticketController.getTicketMentions);
router.post('/:id/messages', requireAuth, createRateLimiter(10, 60 * 1000), ticketController.sendMessage);
router.post('/:id/status', requireAuth, ticketController.updateStatus);

module.exports = router;
