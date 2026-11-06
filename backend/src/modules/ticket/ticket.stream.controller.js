const Ticket = require('../../models/Ticket');
const { subscribeLocalEvent } = require('../../lib/redis');
const { isValidEntityId, buildIdFilter } = require('../../utils/publicId');
const AppError = require('../../utils/AppError');

function extractUserId(req) {
  return (req.user && (req.user.publicId || req.user.sub || req.user.userId || req.user.id)) || null;
}

class TicketStreamController {
  async streamTicketEvents(req, res, next) {
    try {
      const userId = extractUserId(req);
      if (!userId) return next(AppError.unauthorized('Authentication required', 'ERR_UNAUTHORIZED'));

      const ticketId = req.params.id;
      if (!isValidEntityId(ticketId, 'ticket')) {
        return next(AppError.badRequest('Invalid ticket ID format', 'ERR_INVALID_PAYLOAD'));
      }

      const t = await Ticket.findOne(buildIdFilter(ticketId)).select('publicId user status priority deletedByUser').lean();
      if (!t) return next(AppError.notFound('Ticket not found', 'ERR_TICKET_NOT_FOUND'));

      const isOwner = String(t.user) === String(userId);
      const isAdmin = req.user?.role === 'admin';
      if (!isOwner && !isAdmin) {
        return next(AppError.forbidden('Forbidden', 'ERR_TICKET_FORBIDDEN'));
      }
      if (t.deletedByUser && !isAdmin) {
        return next(AppError.forbidden('Ticket is deleted', 'ERR_TICKET_DELETED'));
      }

      const publicTicketId = t.publicId;

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (res.flushHeaders) res.flushHeaders();

      res.write(`data: ${JSON.stringify({ type: 'CONNECTED', ticketId: publicTicketId, status: t.status, priority: t.priority })}\n\n`);
      if (res.flush) res.flush();

      const unsubscribe1 = subscribeLocalEvent(`ticket:${publicTicketId}`, (payload) => {
        const dataStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
        res.write(`data: ${dataStr}\n\n`);
        if (res.flush) res.flush();
      });

      const unsubs = [unsubscribe1];

      const pingInterval = setInterval(() => {
        res.write(': ping\n\n');
        if (res.flush) res.flush();
      }, 15000);

      req.on('close', () => {
        clearInterval(pingInterval);
        unsubs.forEach((u) => u && u());
        res.end();
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TicketStreamController();
