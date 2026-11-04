const ticketService = require('./ticket.service');
const User = require('../../models/User');
const Ticket = require('../../models/Ticket');
const { sendMailTemplate } = require('../../lib/mail');
const { createTicketSchema, sendTicketMessageSchema, updateTicketStatusSchema, ticketIdParamSchema, getMineQuerySchema } = require('./ticket.schema');
const { getOrSetCache, deleteCache, deleteCachePattern, publishEvent } = require('../../lib/redis');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');
const { buildIdFilter, formatPublicEntity } = require('../../utils/publicId');
const AppError = require('../../utils/AppError');

function extractUserId(req) {
  return (req.user && (req.user.publicId || req.user.sub || req.user.userId || req.user.id)) || null;
}

function setPrivateNoCache(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
}

function parseTicketId(params) {
  const parsed = ticketIdParamSchema.safeParse(params);
  if (!parsed.success) {
    throw AppError.badRequest('Invalid ticket ID format', 'ERR_INVALID_ID', parsed.error.flatten());
  }
  return parsed.data.id;
}

async function verifyTicketAccess(ticketId, userId, isAdmin) {
  const t = await Ticket.findOne(buildIdFilter(ticketId)).select('publicId user deletedByUser').populate('user', 'publicId').lean();
  if (!t) throw AppError.notFound('Ticket not found', 'ERR_TICKET_NOT_FOUND');
  const ownerId = t.user?.publicId || String(t.user || '');
  if (ownerId !== String(userId) && !isAdmin) throw AppError.forbidden('Forbidden', 'ERR_TICKET_FORBIDDEN');
  if (t.deletedByUser && !isAdmin) throw AppError.forbidden('Ticket is deleted', 'ERR_TICKET_DELETED');
  return t;
}

async function invalidateTicketCaches(ticketId, userId, clearMessages = false) {
  const uStr = String(userId);
  const keys = [
    `tickets:user:counts:${uStr}`, 'tickets:admin:counts:all',
    `tickets:mine:${uStr}:1:10::::::`, `tickets:mine:${uStr}:1:20::::::`,
    `tickets:mine:${uStr}:1:10:open:::::`, `tickets:mine:${uStr}:1:10:closed:::::`,
    'tickets:admin:list::::::newest:1:10', 'tickets:admin:list::::::newest:1:20',
    'tickets:admin:list::open::::newest:1:10', 'tickets:admin:list::in_progress::::newest:1:10', 'tickets:admin:list::closed::::newest:1:10',
  ];
  const ops = keys.map((k) => deleteCache(k));
  ops.push(deleteCachePattern(`tickets:mine:${uStr}:*`), deleteCachePattern('tickets:admin:list:*'), deleteCachePattern('tickets:admin:counts:*'));
  if (ticketId) ops.push(deleteCache(`tickets:detail:${ticketId}`), deleteCache(`tickets:admin:detail:${ticketId}`), deleteCachePattern(`mentions:ticket:${ticketId}:*`));
  if (clearMessages && ticketId) ops.push(deleteCache(`tickets:messages:${ticketId}:public`), deleteCache(`tickets:messages:${ticketId}:admin`));
  await Promise.allSettled(ops);
}

function sendTicketCreatedEmail(userId, ticket) {
  const publicTicketId = ticket?.publicId;
  setImmediate(async () => {
    try {
      const u = await User.findOne(buildIdFilter(userId)).select('email username').lean();
      if (!u || !u.email) return;
      const frontendUrl = (process.env.FRONTEND_URL || '').replace(/^(?!https?:\/\/)/, 'https://');
      await sendMailTemplate({
        to: u.email,
        templateKey: 'ticketCreated',
        data: {
          username: u.username,
          title: ticket.title,
          ticketId: publicTicketId,
          category: String(ticket.category).charAt(0).toUpperCase() + String(ticket.category).slice(1),
          priority: String(ticket.priority).charAt(0).toUpperCase() + String(ticket.priority).slice(1),
          frontendUrl,
        },
      });
    } catch (mailErr) {
      writeAudit(null, 'ticket.email.send_failed', 'ticket', publicTicketId, { error: mailErr.message }).catch(() => {});
    }
  });
}

async function publishTicketUpdate(ticketId, ticket, status) {
  const publicTicketId = ticket?.publicId;
  const payload = {
    type: 'TICKET_UPDATED',
    ticketId: publicTicketId,
    status: status || ticket?.status,
    priority: ticket?.priority,
    updatedAt: ticket?.updatedAt,
  };
  await publishEvent(`ticket:${publicTicketId}`, payload);
  await publishEvent(`ticket:${publicTicketId}`, { type: 'TICKET_STATUS', ticketId: publicTicketId, status: status || ticket?.status });
}

class TicketController {
  async getCategories(req, res, next) {
    try {
      setPrivateNoCache(res);
      const categories = await getOrSetCache('tickets:categories', () => ticketService.getTicketCategories(), 300);
      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }

  async createTicket(req, res, next) {
    try {
      setPrivateNoCache(res);
      const userId = extractUserId(req);
      if (!userId) return next(AppError.unauthorized('Authentication required', 'ERR_UNAUTHORIZED'));

      const parsed = createTicketSchema.safeParse(req.body);
      if (!parsed.success) {
        throw AppError.badRequest('Validation failed', 'ERR_INVALID_PAYLOAD', parsed.error.flatten());
      }
      const ticket = await ticketService.createTicket(userId, parsed.data);
      sendTicketCreatedEmail(userId, ticket);

      await invalidateTicketCaches(null, userId);
      await deleteCache('tickets:admin:categories:usage');
      const publicTicketId = ticket.publicId;
      const createdPayload = { created: { subject: ticket.title, category: ticket.category, priority: ticket.priority } };
      await logUserActivity(req, 'ticket.create', { ticketId: publicTicketId, ...createdPayload });
      await writeAudit(req, 'ticket.create', 'ticket', publicTicketId, createdPayload);
      const responseData = formatPublicEntity(ticket, 'ticket');
      res.status(201).json(responseData);
    } catch (error) {
      next(error);
    }
  }

  async getCounts(req, res, next) {
    try {
      setPrivateNoCache(res);
      const userId = extractUserId(req);
      if (!userId) return next(AppError.unauthorized('Authentication required', 'ERR_UNAUTHORIZED'));

      const cacheKey = `tickets:user:counts:${userId}`;
      const counts = await getOrSetCache(cacheKey, () => ticketService.getUserTicketCounts(userId), 30);
      res.json(counts);
    } catch (error) {
      next(error);
    }
  }

  async getMine(req, res, next) {
    try {
      setPrivateNoCache(res);
      const userId = extractUserId(req);
      if (!userId) return next(AppError.unauthorized('Authentication required', 'ERR_UNAUTHORIZED'));

      const queryParsed = getMineQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        throw AppError.badRequest('Invalid query parameters', 'ERR_TICKET_QUERY_INVALID', queryParsed.error.flatten());
      }
      const { page, limit, status, category, search, sortBy } = queryParsed.data;

      const cacheKey = `tickets:mine:${userId}:${page}:${limit}:${status || ''}:${category || ''}:${search || ''}:${sortBy || ''}`;
      const payload = await getOrSetCache(cacheKey, async () => {
        const { tickets, total } = await ticketService.getUserTickets(userId, { page, limit, status, category, search, sortBy });
        return {
          tickets,
          pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        };
      }, 30);

      res.json(payload);
    } catch (error) {
      next(error);
    }
  }

  async getTicketDetail(req, res, next) {
    try {
      setPrivateNoCache(res);
      const userId = extractUserId(req);
      if (!userId) return next(AppError.unauthorized('Authentication required', 'ERR_UNAUTHORIZED'));

      const ticketId = parseTicketId(req.params);
      const isAdmin = req.user?.role === 'admin';
      const cacheKey = `tickets:detail:${ticketId}`;
      const ticket = await getOrSetCache(cacheKey, () => ticketService.getTicketDetail(ticketId, userId, isAdmin), 30);
      const ownerId = ticket?.user?.publicId || String(ticket?.user || '');
      if (ownerId && ownerId !== String(userId) && !isAdmin) {
        throw AppError.forbidden('Forbidden', 'ERR_TICKET_FORBIDDEN');
      }
      if (ticket?.deletedByUser && !isAdmin) {
        throw AppError.forbidden('This ticket has been deleted', 'ERR_TICKET_DELETED');
      }
      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }

  async getTicketMessages(req, res, next) {
    try {
      setPrivateNoCache(res);
      const userId = extractUserId(req);
      if (!userId) return next(AppError.unauthorized('Authentication required', 'ERR_UNAUTHORIZED'));

      const ticketId = parseTicketId(req.params);
      const isAdmin = req.user?.role === 'admin';
      await verifyTicketAccess(ticketId, userId, isAdmin);

      const cacheKey = isAdmin ? `tickets:messages:${ticketId}:admin` : `tickets:messages:${ticketId}:public`;
      const messages = await getOrSetCache(cacheKey, () => ticketService.getTicketMessages(ticketId, userId, isAdmin), 30);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  }

  async getMentionsSearch(req, res, next) {
    try {
      setPrivateNoCache(res);
      const userId = extractUserId(req);
      if (!userId) return next(AppError.unauthorized('Authentication required', 'ERR_UNAUTHORIZED'));

      const cacheKey = `mentions:search:${userId}`;
      const mentions = await getOrSetCache(cacheKey, () => ticketService.getMentions(userId), 60);
      res.json(mentions);
    } catch (error) {
      next(error);
    }
  }

  async getTicketMentions(req, res, next) {
    try {
      setPrivateNoCache(res);
      const userId = extractUserId(req);
      if (!userId) return next(AppError.unauthorized('Authentication required', 'ERR_UNAUTHORIZED'));

      const ticketId = parseTicketId(req.params);
      const isAdmin = req.user?.role === 'admin';
      const t = await verifyTicketAccess(ticketId, userId, isAdmin);

      const cacheKey = `mentions:ticket:${ticketId}`;
      const mentions = await getOrSetCache(cacheKey, () => ticketService.getMentions(t.user), 60);
      res.json(mentions);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      setPrivateNoCache(res);
      const userId = extractUserId(req);
      if (!userId) return next(AppError.unauthorized('Authentication required', 'ERR_UNAUTHORIZED'));
      const ticketId = parseTicketId(req.params);
      const isAdmin = req.user?.role === 'admin';
      const parsed = sendTicketMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        throw AppError.badRequest('Invalid message payload', 'ERR_MESSAGE_VALIDATION_FAILED', parsed.error.flatten());
      }
      const result = await ticketService.sendTicketMessage(ticketId, userId, parsed.data.body, isAdmin);
      const ownerId = result.ticket?.user ? String(result.ticket.user) : String(userId);
      await invalidateTicketCaches(ticketId, ownerId, true);
      const publicTicketId = result.ticket.publicId || ticketId;
      await logUserActivity(req, 'ticket.reply', { ticketId: publicTicketId });
      await writeAudit(req, 'ticket.reply', 'ticket', publicTicketId, { messagePreview: parsed.data.body.substring(0, 50) });
      await publishEvent(`ticket:${ticketId}`, { type: 'TICKET_MESSAGE', ticketId, message: result.message });
      await publishTicketUpdate(ticketId, result.ticket, result.status);
      res.json({ ok: true, message: result.message, status: result.status });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      setPrivateNoCache(res);
      const userId = extractUserId(req);
      if (!userId) return next(AppError.unauthorized('Authentication required', 'ERR_UNAUTHORIZED'));

      const ticketId = parseTicketId(req.params);
      const isAdmin = req.user?.role === 'admin';
      const parsed = updateTicketStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        throw AppError.badRequest('Invalid status payload', 'ERR_STATUS_VALIDATION_FAILED', parsed.error.flatten());
      }
      const result = await ticketService.updateTicketStatus(ticketId, userId, parsed.data.action, isAdmin);
      const ownerId = result.ticket?.user ? String(result.ticket.user) : String(userId);
      await invalidateTicketCaches(ticketId, ownerId, false);
      const publicTicketId = result.ticket.publicId || ticketId;
      const changes = { status: { old: result.oldStatus, new: result.ticket.status } };
      await logUserActivity(req, 'ticket.status_change', { ticketId: publicTicketId, changes });
      await writeAudit(req, 'ticket.status_change', 'ticket', publicTicketId, { changes });
      await publishTicketUpdate(ticketId, result.ticket, result.ticket.status);

      res.json({ ok: true, status: result.ticket.status });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TicketController();
