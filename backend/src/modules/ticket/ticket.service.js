const User = require('../../models/User');
const Ticket = require('../../models/Ticket');
const TicketMessage = require('../../models/TicketMessage');
const UserPlan = require('../../models/UserPlan');
const { acquireLock, releaseLock } = require('../../lib/redis');
const { sanitizeTicketMentions } = require('../../utils/ticketMentions');
const { buildIdFilter, isValidPublicId, formatPublicEntity } = require('../../utils/publicId');
const {
  getActiveTicketsCount,
  getTicketCategories,
  getUserTicketCounts,
  getMentions,
  formatTicketMessage,
} = require('./ticket.helpers');
const AppError = require('../../utils/AppError');

class TicketService {
  getActiveTicketsCount(userId) {
    return getActiveTicketsCount(userId);
  }

  getTicketCategories() {
    return getTicketCategories();
  }

  async createTicket(userId, { title, message, category, priority }) {
    const lockKey = `ticket:create:${userId}`;
    const lockToken = await acquireLock(lockKey, 5000);
    if (!lockToken) {
      throw AppError.tooManyRequests('Ticket creation in progress, please wait', 'ERR_TICKET_RATE_LIMIT');
    }

    try {
      const user = await User.findOne(buildIdFilter(userId)).select('_id').lean();
      if (!user) {
        throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
      }
      const userDocId = user._id;

      const activeCount = await this.getActiveTicketsCount(userId);
      if (activeCount >= 3) {
        throw AppError.tooManyRequests(
          'You have reached the maximum limit of active tickets. Please wait for existing tickets to be resolved.',
          'ERR_TICKET_LIMIT_REACHED'
        );
      }

      const categories = await this.getTicketCategories();
      const finalCategory = categories.find(c => c.toLowerCase() === (category || '').toLowerCase()) || categories[0] || 'general';

      let effectivePriority = 'low';
      if (priority && ['low', 'medium', 'high'].includes(priority)) {
        effectivePriority = priority;
      } else {
        try {
          const activePlans = await UserPlan.find({ userId: userDocId, status: 'active' }).select('_id').limit(1).lean();
          if (activePlans && activePlans.length > 0) effectivePriority = 'high';
        } catch (_planQueryErr) {
          effectivePriority = 'low';
        }
      }

      const now = new Date();
      const ticket = await Ticket.create({
        user: userDocId,
        title: title.trim(),
        category: finalCategory,
        priority: effectivePriority,
        lastUserActivityAt: now,
      });

      const sanitizedBody = await sanitizeTicketMentions(message.trim(), userId);

      await TicketMessage.create({
        ticket: ticket._id,
        author: userDocId,
        authorRole: 'user',
        body: sanitizedBody,
        createdAt: now
      });

      return ticket;
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }

  getUserTicketCounts(userId) {
    return getUserTicketCounts(userId);
  }

  async getUserTickets(userId, { page, limit, status, category, search, sortBy }) {
    const query = { user: userId, deletedByUser: { $ne: true } };
    if (status && status !== 'all') query.status = status;
    if (category) query.category = category;
    if (search && typeof search === 'string') {
      const trimmed = search.trim();
      if (trimmed) {
        const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = { $regex: escaped, $options: 'i' };
        const orConditions = [{ title: searchRegex }];

        const cleanId = trimmed.replace(/^ticket\s*#?\s*/i, '').replace(/^#\s*/, '').trim();
        if (isValidPublicId(cleanId, 'ticket')) {
          orConditions.push({ publicId: cleanId });
        } else if (/^tkt_[0-9a-f]{1,20}$/i.test(cleanId)) {
          orConditions.push({ publicId: { $regex: cleanId, $options: 'i' } });
        }

        if (cleanId && cleanId !== trimmed) {
          const cleanEscaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          orConditions.push({ title: { $regex: cleanEscaped, $options: 'i' } });
        }

        query.$or = orConditions;
      }
    }

    let sort = { updatedAt: -1 };
    switch (sortBy) {
      case 'updated_desc': sort = { updatedAt: -1 }; break;
      case 'updated_asc': sort = { updatedAt: 1 }; break;
      case 'created_desc': sort = { createdAt: -1 }; break;
      case 'created_asc': sort = { createdAt: 1 }; break;
    }

    const [total, tickets] = await Promise.all([
      Ticket.countDocuments(query),
      Ticket.find(query)
        .select('publicId user assignee title category priority status tags deletedByUser lastUserActivityAt lastAdminReplyAt closedAt createdAt updatedAt')
        .populate('user', 'publicId username email profilePicture')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const mappedTickets = tickets.map((t) => {
      const clean = formatPublicEntity(t, 'ticket');
      if (clean.user && typeof clean.user === 'object') {
        clean.user = formatPublicEntity(clean.user, 'user');
      } else {
        clean.user = null;
      }
      return clean;
    });

    return { tickets: mappedTickets, total };
  }

  async getTicketDetail(ticketId, userId, isAdmin = false) {
    const t = await Ticket.findOne(buildIdFilter(ticketId))
      .select('publicId user assignee title category priority status tags deletedByUser lastUserActivityAt lastAdminReplyAt closedAt createdAt updatedAt')
      .populate('user', 'publicId username email profilePicture')
      .lean();
    if (!t) throw AppError.notFound('Ticket not found', 'ERR_TICKET_NOT_FOUND');
    const ownerId = t.user?.publicId || String(t.user || '');
    if (ownerId !== String(userId) && !isAdmin) throw AppError.forbidden('Forbidden', 'ERR_TICKET_FORBIDDEN');
    if (t.deletedByUser && !isAdmin) throw AppError.forbidden('This ticket has been deleted', 'ERR_TICKET_DELETED');

    const formatted = formatPublicEntity(t, 'ticket');
    if (formatted.user && typeof formatted.user === 'object') {
      formatted.user = formatPublicEntity(formatted.user, 'user');
    }
    formatted.messages = [];
    return formatted;
  }

  async getTicketMessages(ticketId, userId, isAdmin = false) {
    const t = await Ticket.findOne(buildIdFilter(ticketId)).select('_id publicId user deletedByUser').lean();
    if (!t) throw AppError.notFound('Ticket not found', 'ERR_TICKET_NOT_FOUND');
    if (String(t.user) !== String(userId) && !isAdmin) throw AppError.forbidden('Forbidden', 'ERR_TICKET_FORBIDDEN');
    if (t.deletedByUser && !isAdmin) throw AppError.forbidden('Ticket is deleted', 'ERR_TICKET_DELETED');

    const msgQuery = { ticket: t._id };
    if (!isAdmin) {
      msgQuery.internal = { $ne: true };
    }

    const messages = await TicketMessage.find(msgQuery)
      .select('publicId ticket author authorRole body internal createdAt')
      .populate('author', 'publicId username email profilePicture')
      .sort({ createdAt: 1 })
      .lean();

    const publicTicketId = t.publicId;
    return messages.map((m) => formatTicketMessage(m, publicTicketId, isAdmin));
  }

  getMentions(userId) {
    return getMentions(userId);
  }

  async sendTicketMessage(ticketId, userId, body, isAdmin = false) {
    const lockKey = `ticket:mutation:${ticketId}`;
    const lockToken = await acquireLock(lockKey, 5000);
    if (!lockToken) {
      throw AppError.tooManyRequests('Message send in progress, please wait', 'ERR_TICKET_RATE_LIMIT');
    }

    try {
      const t = await Ticket.findOne(buildIdFilter(ticketId));
      if (!t) throw AppError.notFound('Ticket not found', 'ERR_TICKET_NOT_FOUND');
      if (String(t.user) !== String(userId) && !isAdmin) throw AppError.forbidden('Forbidden', 'ERR_TICKET_FORBIDDEN');
      if (t.deletedByUser && !isAdmin) throw AppError.forbidden('Ticket is deleted', 'ERR_TICKET_DELETED');
      if (t.status === 'closed') throw AppError.badRequest('Ticket is closed. Please reopen it first.', 'ERR_TICKET_CLOSED');

      if (!isAdmin) {
        const lastUserMessage = await TicketMessage.findOne({ ticket: t._id, author: userId })
          .select('createdAt')
          .sort({ _id: -1 })
          .lean();
        if (lastUserMessage) {
          const timeSinceLastMessage = Date.now() - new Date(lastUserMessage.createdAt).getTime();
          if (timeSinceLastMessage < 10000) {
            throw AppError.tooManyRequests('Please wait a few seconds before sending another message.', 'ERR_TICKET_RATE_LIMIT');
          }
        }
      }

      const sanitizedBody = await sanitizeTicketMentions(body.trim(), userId);
      const savedMsg = await TicketMessage.create({
        ticket: t._id,
        author: userId,
        authorRole: isAdmin ? 'admin' : 'user',
        body: sanitizedBody,
        createdAt: new Date()
      });

      t.updatedAt = new Date();
      t.lastUserActivityAt = new Date();
      if (t.status === 'resolved' || t.status === 'pending') t.status = 'open';
      await t.save();

      await savedMsg.populate('author', 'publicId username email profilePicture');
      const msgObj = formatTicketMessage(savedMsg.toObject(), t.publicId, isAdmin);
      return { message: msgObj, status: t.status, ticket: t };
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }

  async updateTicketStatus(ticketId, userId, action, isAdmin = false) {
    const lockKey = `ticket:mutation:${ticketId}`;
    const lockToken = await acquireLock(lockKey, 5000);
    if (!lockToken) {
      throw AppError.tooManyRequests('Status update in progress, please wait', 'ERR_TICKET_RATE_LIMIT');
    }

    try {
      const t = await Ticket.findOne(buildIdFilter(ticketId));
      if (!t) throw AppError.notFound('Ticket not found', 'ERR_TICKET_NOT_FOUND');
      if (String(t.user) !== String(userId) && !isAdmin) throw AppError.forbidden('Forbidden', 'ERR_TICKET_FORBIDDEN');
      if (t.deletedByUser && !isAdmin) throw AppError.forbidden('Ticket is deleted', 'ERR_TICKET_DELETED');

      const oldStatus = t.status;

      if (action === 'resolved' || action === 'resolve') {
        if (t.status === 'closed') {
          throw AppError.badRequest('Cannot modify a closed ticket.', 'ERR_TICKET_CLOSED');
        }
        t.status = 'resolved';
      } else if (action === 'reopen') {
        const activeCount = await this.getActiveTicketsCount(userId);
        if (activeCount >= 3) {
          throw AppError.tooManyRequests('You have reached the maximum limit of 3 active tickets. Cannot reopen.', 'ERR_TICKET_LIMIT_REACHED');
        }
        t.status = 'open';
        t.closedAt = null;
      } else {
        throw AppError.badRequest('Invalid action', 'ERR_INVALID_ACTION');
      }

      t.updatedAt = new Date();
      await t.save();

      return { ticket: t, oldStatus };
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }
}

module.exports = new TicketService();
