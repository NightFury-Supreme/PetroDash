const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const { ticketsController } = require('../../modules/admin/tickets');

const router = express.Router();

router.get('/counts', requireAdmin, ticketsController.getCounts);
router.get('/', requireAdmin, ticketsController.listTickets);
router.get('/:id/messages', requireAdmin, ticketsController.getMessages);
router.get('/:id', requireAdmin, ticketsController.getTicket);
router.post('/:id/messages', requireAdmin, createRateLimiter(30, 60 * 1000), ticketsController.addMessage);
router.patch('/:id', requireAdmin, createRateLimiter(30, 60 * 1000), ticketsController.updateTicket);
router.delete('/:id', requireAdmin, createRateLimiter(20, 60 * 1000), ticketsController.deleteTicket);

router.get('/settings/categories', requireAdmin, ticketsController.getCategories);
router.get('/settings/categories/usage', requireAdmin, ticketsController.getCategoryUsage);
router.patch('/settings/categories', requireAdmin, createRateLimiter(10, 60 * 1000), ticketsController.updateCategories);

module.exports = router;
