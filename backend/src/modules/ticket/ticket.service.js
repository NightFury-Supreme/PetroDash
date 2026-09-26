const mongoose = require('mongoose');
const Ticket = require('../../models/Ticket');
const TicketMessage = require('../../models/TicketMessage');
const Server = require('../../models/Server');
const Payment = require('../../models/Payment');
const UserPlan = mongoose.model('UserPlan');
const { getSettings } = require('../../lib/settings');
const { sanitizeTicketMentions } = require('../../utils/ticketMentions');
const AppError = require('../../utils/AppError');

class TicketService {
  async getActiveTicketsCount(userId) {
    return Ticket.countDocuments({
      user: userId,
      status: { $in: ['open', 'pending'] },
      deletedByUser: { $ne: true }
    });
  }

  async getTicketCategories() {
    let allowedCategories = ['general', 'billing', 'technical', 'abuse', 'account', 'server', 'payment', 'other'];
    try {
      const s = await getSettings();
      if (s && Array.isArray(s.ticketCategories) && s.ticketCategories.length > 0) {
        allowedCategories = s.ticketCategories.map((c) => String(c)).filter(Boolean);
      }
    } catch (_) {}
    return allowedCategories;
  }

  async createTicket(userId, { title, message, category, priority }) {
    const activeCount = await this.getActiveTicketsCount(userId);
    if (activeCount >= 3) {
      throw new AppError('You have reached the maximum limit of active tickets. Please wait for existing tickets to be resolved.', 429, 'ERR_TICKET_LIMIT_REACHED');
    }

    const categories = await this.getTicketCategories();
    const finalCategory = categories.find(c => c.toLowerCase() === (category || '').toLowerCase()) || categories[0] || 'general';

    let effectivePriority = 'low';
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      effectivePriority = priority;
    } else {
      try {
        const activePlans = await UserPlan.find({ userId, status: 'active' }).limit(1).lean();
        if (activePlans && activePlans.length > 0) effectivePriority = 'high';
      } catch (_) {}
    }

    const now = new Date();
    const ticket = await Ticket.create({
      user: new mongoose.Types.ObjectId(String(userId)),
      title: title.trim(),
      category: finalCategory,
      priority: effectivePriority,
      lastUserActivityAt: now,
    });

    const sanitizedBody = await sanitizeTicketMentions(message.trim(), userId);
    
    await TicketMessage.create({
      ticket: ticket._id,
      author: userId,
      authorRole: 'user',
      body: sanitizedBody,
      createdAt: now
    });

    return ticket;
  }

  async getUserTicketCounts(userId) {
    const agg = await Ticket.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(String(userId)), deletedByUser: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const counts = { all: 0, open: 0, pending: 0, resolved: 0, closed: 0 };
    for (const row of agg) {
      if (counts[row._id] !== undefined) {
        counts[row._id] = row.count;
        counts.all += row.count;
      }
    }
    return counts;
  }

  async getUserTickets(userId, { page, limit, status, category, search, sortBy }) {
    const query = { user: userId, deletedByUser: { $ne: true } };
    if (status && status !== 'all') query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { _id: search.length === 24 ? search : null }
      ].filter(c => c._id !== null || c.title);
    }

    let sort = { updatedAt: -1 };
    switch (sortBy) {
      case 'updated_desc': sort = { updatedAt: -1 }; break;
      case 'updated_asc': sort = { updatedAt: 1 }; break;
      case 'created_desc': sort = { createdAt: -1 }; break;
      case 'created_asc': sort = { createdAt: 1 }; break;
    }

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return { tickets, total };
  }

  async getTicketDetail(ticketId, userId) {
    const t = await Ticket.findById(ticketId).populate('user', 'username email').lean();
    if (!t) throw new AppError('Ticket not found', 404, 'ERR_TICKET_NOT_FOUND');
    if (String(t.user._id) !== String(userId)) throw new AppError('Forbidden', 403, 'ERR_TICKET_FORBIDDEN');
    if (t.deletedByUser) throw new AppError('This ticket has been deleted', 403, 'ERR_TICKET_DELETED');
    
    t.messages = [];
    return t;
  }

  async getTicketMessages(ticketId, userId) {
    const t = await Ticket.findById(ticketId).select('user deletedByUser').lean();
    if (!t) throw new AppError('Ticket not found', 404, 'ERR_TICKET_NOT_FOUND');
    if (String(t.user) !== String(userId)) throw new AppError('Forbidden', 403, 'ERR_TICKET_FORBIDDEN');
    if (t.deletedByUser) throw new AppError('Ticket is deleted', 403, 'ERR_TICKET_DELETED');

    return TicketMessage.find({ ticket: ticketId })
      .populate('author', 'username email profilePicture')
      .sort({ createdAt: 1 })
      .lean();
  }

  async getMentions(userId) {
    let uid;
    try { uid = new mongoose.Types.ObjectId(String(userId)); } catch { uid = userId; }
    const [servers, payments] = await Promise.all([
      Server.find({ owner: uid }).select('_id name identifier').limit(5).lean(),
      Payment.find({ userId: uid, status: 'COMPLETED' }).select('_id amount createdAt').sort({ createdAt: -1 }).limit(5).lean()
    ]);
    return { servers, payments };
  }

  async sendTicketMessage(ticketId, userId, body) {
    const t = await Ticket.findById(ticketId);
    if (!t) throw new AppError('Ticket not found', 404, 'ERR_TICKET_NOT_FOUND');
    if (String(t.user) !== String(userId)) throw new AppError('Forbidden', 403, 'ERR_TICKET_FORBIDDEN');
    if (t.deletedByUser) throw new AppError('Ticket is deleted', 403, 'ERR_TICKET_DELETED');
    if (t.status === 'closed') throw new AppError('Ticket is closed. Please reopen it first.', 400, 'ERR_TICKET_CLOSED');

    const lastUserMessage = await TicketMessage.findOne({ ticket: t._id, author: userId }).sort({ _id: -1 }).lean();
    if (lastUserMessage) {
      const timeSinceLastMessage = Date.now() - new Date(lastUserMessage.createdAt).getTime();
      if (timeSinceLastMessage < 10000) {
        throw new AppError('Please wait a few seconds before sending another message.', 429, 'ERR_TICKET_RATE_LIMIT');
      }
    }

    const sanitizedBody = await sanitizeTicketMentions(body.trim(), userId);
    const savedMsg = await TicketMessage.create({
      ticket: t._id,
      author: userId,
      authorRole: 'user',
      body: sanitizedBody,
      createdAt: new Date()
    });

    t.updatedAt = new Date();
    t.lastUserActivityAt = new Date();
    if (t.status === 'resolved' || t.status === 'pending') t.status = 'open';
    await t.save();

    await savedMsg.populate('author', 'username email profilePicture');
    return { message: savedMsg, status: t.status, ticket: t };
  }

  async updateTicketStatus(ticketId, userId, action) {
    const t = await Ticket.findById(ticketId);
    if (!t) throw new AppError('Ticket not found', 404, 'ERR_TICKET_NOT_FOUND');
    if (String(t.user) !== String(userId)) throw new AppError('Forbidden', 403, 'ERR_TICKET_FORBIDDEN');
    
    const oldStatus = t.status;

    if (action === 'resolved') {
      if (t.status === 'closed') {
        throw new AppError('Cannot modify a closed ticket.', 400, 'ERR_TICKET_CLOSED');
      }
      t.status = 'resolved';
    } else if (action === 'reopen') {
      const activeCount = await this.getActiveTicketsCount(userId);
      if (activeCount >= 3) {
        throw new AppError('You have reached the maximum limit of 3 active tickets. Cannot reopen.', 429, 'ERR_TICKET_LIMIT_REACHED');
      }
      t.status = 'open';
      t.closedAt = null;
    }

    t.updatedAt = new Date();
    await t.save();

    return { ticket: t, oldStatus };
  }
}

module.exports = new TicketService();
