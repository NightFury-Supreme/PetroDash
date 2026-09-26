const ticketService = require('./ticket.service');
const User = require('../../models/User');
const { sendMailTemplate } = require('../../lib/mail');
const { createTicketSchema, sendTicketMessageSchema, updateTicketStatusSchema } = require('./ticket.schema');
const { getCache, setCache, deleteCachePattern } = require('../../lib/redis');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');
const AppError = require('../../utils/AppError');

function extractUserId(req) {
  return (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || null;
}

class TicketController {
  async getCategories(req, res, next) {
    try {
      const categories = await ticketService.getTicketCategories();
      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }

  async createTicket(req, res, next) {
    try {
      const userId = extractUserId(req);
      const data = createTicketSchema.parse(req.body);
      
      const ticket = await ticketService.createTicket(userId, data);
      
      setImmediate(async () => {
        try {
          const u = await User.findById(userId).lean();
          if (u && u.email) {
            let frontendHost = process.env.FRONTEND_URL || '';
            if (frontendHost && !frontendHost.startsWith('http')) {
              frontendHost = `https://${frontendHost}`;
            }
            await sendMailTemplate({
              to: u.email,
              templateKey: 'ticketCreated',
              data: {
                username: u.username,
                title: ticket.title,
                ticketId: String(ticket._id),
                category: String(ticket.category).charAt(0).toUpperCase() + String(ticket.category).slice(1),
                priority: String(ticket.priority).charAt(0).toUpperCase() + String(ticket.priority).slice(1),
                frontendUrl: frontendHost
              }
            });
          }
        } catch (_) {}
      });
      await deleteCachePattern(`tickets:mine:${userId}:*`);
      await deleteCachePattern('tickets:admin:list:*');
      await deleteCachePattern('tickets:admin:counts:*');

      const createdPayload = { created: { subject: ticket.title, category: ticket.category, priority: ticket.priority } };
      await logUserActivity(req, 'ticket.create', { ticketId: ticket._id, ...createdPayload });
      await writeAudit(req, 'ticket.create', 'ticket', ticket._id.toString(), createdPayload);
      
      res.status(201).json(ticket);
    } catch (error) {
      if (error.name === 'ZodError') {
        return next(new AppError('Validation failed', 400, 'ERR_INVALID_PAYLOAD', error.errors));
      }
      next(error);
    }
  }

  async getCounts(req, res, next) {
    try {
      const userId = extractUserId(req);
      const cacheKey = `tickets:user:counts:${userId}`;
      const cached = await getCache(cacheKey);
      if (cached) return res.json(cached);

      const counts = await ticketService.getUserTicketCounts(userId);
      await setCache(cacheKey, counts, 30);
      res.json(counts);
    } catch (error) {
      next(error);
    }
  }

  async getMine(req, res, next) {
    try {
      const userId = extractUserId(req);
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 25));
      const status = req.query.status;
      const category = req.query.category;
      const search = req.query.search;
      const sortBy = req.query.sortBy;

      const cacheKey = `tickets:mine:${userId}:${page}:${limit}:${status || ''}:${category || ''}:${search || ''}:${sortBy || ''}`;
      const cached = await getCache(cacheKey);
      if (cached) return res.json(cached);

      const { tickets, total } = await ticketService.getUserTickets(userId, { page, limit, status, category, search, sortBy });
      
      const payload = {
        tickets,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) }
      };

      await setCache(cacheKey, payload, 30);
      res.json(payload);
    } catch (error) {
      next(error);
    }
  }

  async getTicketDetail(req, res, next) {
    try {
      const userId = extractUserId(req);
      const ticketId = req.params.id;
      
      const cacheKey = `tickets:detail:${ticketId}`;
      const cached = await getCache(cacheKey);
      if (cached) return res.json(cached);

      const ticket = await ticketService.getTicketDetail(ticketId, userId);
      await setCache(cacheKey, ticket, 30);
      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }

  async getTicketMessages(req, res, next) {
    try {
      const userId = extractUserId(req);
      const ticketId = req.params.id;

      const cacheKey = `tickets:messages:${ticketId}`;
      const cached = await getCache(cacheKey);
      if (cached) return res.json(cached);

      const messages = await ticketService.getTicketMessages(ticketId, userId);
      await setCache(cacheKey, messages, 30);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  }

  async getMentionsSearch(req, res, next) {
    try {
      const userId = extractUserId(req);
      const cacheKey = `mentions:search:${userId}`;
      const cached = await getCache(cacheKey);
      if (cached) return res.json(cached);

      const mentions = await ticketService.getMentions(userId);
      await setCache(cacheKey, mentions, 60);
      res.json(mentions);
    } catch (error) {
      next(error);
    }
  }

  async getTicketMentions(req, res, next) {
    try {
      const userId = extractUserId(req);
      const ticketId = req.params.id;
      const cacheKey = `mentions:ticket:${ticketId}`;
      const cached = await getCache(cacheKey);
      if (cached) return res.json(cached);

      const Ticket = require('../../models/Ticket');
      const t = await Ticket.findById(ticketId).select('user').lean();
      if (!t) return next(new AppError('Not found', 404, 'ERR_TICKET_NOT_FOUND'));
      if (String(t.user) !== String(userId) && !req.user.isAdmin) {
        return next(new AppError('Forbidden', 403, 'ERR_TICKET_FORBIDDEN'));
      }

      const mentions = await ticketService.getMentions(t.user);
      await setCache(cacheKey, mentions, 60);
      res.json(mentions);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const userId = extractUserId(req);
      const ticketId = req.params.id;
      if (!/^[0-9a-fA-F]{24}$/.test(ticketId)) {
        throw new AppError('Invalid ticket ID format', 400, 'ERR_INVALID_PAYLOAD');
      }

      const data = sendTicketMessageSchema.parse(req.body);
      const result = await ticketService.sendTicketMessage(ticketId, userId, data.body);

      await deleteCachePattern(`tickets:mine:${userId}:*`);
      await deleteCachePattern('tickets:admin:list:*');
      await deleteCachePattern('tickets:admin:counts:*');
      await deleteCachePattern(`tickets:detail:${ticketId}`);
      await deleteCachePattern(`tickets:messages:${ticketId}`);

      await logUserActivity(req, 'ticket.reply', { ticketId: result.ticket._id });
      await writeAudit(req, 'ticket.reply', 'ticket', result.ticket._id.toString(), { messagePreview: data.body.substring(0, 50) });

      res.json({ ok: true, message: result.message, status: result.status });
    } catch (error) {
      if (error.name === 'ZodError') {
        return next(new AppError('Validation failed', 400, 'ERR_INVALID_PAYLOAD', error.errors));
      }
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const userId = extractUserId(req);
      const ticketId = req.params.id;
      if (!/^[0-9a-fA-F]{24}$/.test(ticketId)) {
        throw new AppError('Invalid ticket ID format', 400, 'ERR_INVALID_PAYLOAD');
      }

      const data = updateTicketStatusSchema.parse(req.body);
      const result = await ticketService.updateTicketStatus(ticketId, userId, data.action);

      await deleteCachePattern(`tickets:mine:${userId}:*`);
      await deleteCachePattern('tickets:admin:list:*');
      await deleteCachePattern('tickets:admin:counts:*');
      await deleteCachePattern(`tickets:detail:${ticketId}`);

      const changes = { status: { old: result.oldStatus, new: result.ticket.status } };
      await logUserActivity(req, 'ticket.status_change', { ticketId: result.ticket._id, changes });
      await writeAudit(req, 'ticket.status_change', 'ticket', result.ticket._id.toString(), { changes });

      res.json({ ok: true, status: result.ticket.status });
    } catch (error) {
      if (error.name === 'ZodError') {
        return next(new AppError('Validation failed', 400, 'ERR_INVALID_PAYLOAD', error.errors));
      }
      next(error);
    }
  }
}

module.exports = new TicketController();
