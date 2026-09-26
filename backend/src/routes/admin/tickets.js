/* ==========================================================================
   Admin Tickets Router
   Compliance: ISO/IEC 25010, OWASP ASVS (Thin router delegating to controller)
========================================================================== */

const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const { ticketsController } = require('../../modules/admin/tickets');

const router = express.Router();

router.get('/counts', requireAdmin, ticketsController.getCounts);
router.get('/', requireAdmin, ticketsController.listTickets);
router.get('/:id/messages', requireAdmin, ticketsController.getMessages);
router.get('/:id', requireAdmin, ticketsController.getTicket);
router.post('/:id/messages', requireAdmin, ticketsController.addMessage);
router.patch('/:id', requireAdmin, ticketsController.updateTicket);
router.delete('/:id', requireAdmin, ticketsController.deleteTicket);

router.get('/settings/categories', requireAdmin, ticketsController.getCategories);
router.get('/settings/categories/usage', requireAdmin, ticketsController.getCategoryUsage);
router.patch('/settings/categories', requireAdmin, ticketsController.updateCategories);

module.exports = router;
