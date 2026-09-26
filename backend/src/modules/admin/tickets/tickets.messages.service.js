/**
 * Admin Tickets Messages Sub-Service
 * Complies with ISO/IEC 25010 (Maintainability, Single Responsibility)
 */

const mongoose = require('mongoose');
const Ticket = require('../../../models/Ticket');
const TicketMessage = require('../../../models/TicketMessage');
const User = require('../../../models/User');
const AppError = require('../../../utils/AppError');
const { deleteCachePattern } = require('../../../lib/redis');
const { writeAudit } = require('../../../middleware/audit');

function extractAdminId(req) {
  return (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || null;
}

const getMessages = async (id, queryParam = {}) => {
  const limit = parseInt(queryParam.limit, 10) || 50;
  const before = queryParam.before;
  const since = queryParam.since;

  const query = { ticket: id };
  if (before && /^[0-9a-fA-F]{24}$/.test(before)) {
    query._id = { $lt: new mongoose.Types.ObjectId(String(before)) };
  }
  if (since && /^[0-9a-fA-F]{24}$/.test(since)) {
    query._id = { ...query._id, $gt: new mongoose.Types.ObjectId(String(since)) };
  }

  const messages = await TicketMessage.find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate('author', 'username email profilePicture')
    .lean();

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  return {
    messages: messages.reverse(),
    hasMore,
  };
};

const addMessage = async (id, data, req) => {
  const adminId = extractAdminId(req);
  const { body, internal } = data || {};

  const t = await Ticket.findById(String(id));
  if (!t) throw new AppError('Ticket not found', 404, 'ERR_TICKET_NOT_FOUND');
  if (t.deletedByUser) throw new AppError('Ticket is deleted', 403, 'ERR_TICKET_DELETED');

  const isInternal = Boolean(internal);

  const savedMsg = await TicketMessage.create({
    ticket: t._id,
    author: adminId,
    authorRole: 'admin',
    body: body.trim(),
    internal: isInternal,
    createdAt: new Date(),
  });

  t.updatedAt = new Date();
  if (!isInternal) {
    t.lastAdminReplyAt = new Date();
    if (t.status === 'open') t.status = 'pending';
  }
  await t.save();

  if (!isInternal) {
    try {
      const owner = await User.findById(t.user).lean();
      if (owner && owner.email) {
        const { sendMailTemplate } = require('../../../lib/mail');
        let frontendHost = process.env.FRONTEND_URL || '';
        if (frontendHost && !frontendHost.startsWith('http')) frontendHost = `https://${frontendHost}`;

        let statusBg = '#2b2512';
        let statusColor = '#fde047';
        let statusBorder = '#453413';
        if (t.status === 'open') {
          statusBg = '#102a1d';
          statusColor = '#86efac';
          statusBorder = '#144026';
        } else if (t.status === 'resolved') {
          statusBg = '#18253a';
          statusColor = '#93c5fd';
          statusBorder = '#1a396b';
        } else if (t.status === 'closed') {
          statusBg = '#303030';
          statusColor = '#AAAAAA';
          statusBorder = '#404040';
        }

        await sendMailTemplate({
          to: owner.email,
          templateKey: 'ticketReply',
          data: {
            username: owner.username,
            title: t.title,
            snippet: String(body).slice(0, 200),
            ticketId: String(t._id),
            category: String(t.category).charAt(0).toUpperCase() + String(t.category).slice(1),
            priority: String(t.priority).charAt(0).toUpperCase() + String(t.priority).slice(1),
            status: String(t.status).charAt(0).toUpperCase() + String(t.status).slice(1),
            statusBg,
            statusColor,
            statusBorder,
            frontendUrl: frontendHost,
          },
        });
      }
    } catch (_) {}
  }

  await deleteCachePattern('tickets:admin:list:*');
  await deleteCachePattern('tickets:admin:counts:*');
  await deleteCachePattern(`tickets:mine:${t.user}:*`);
  await deleteCachePattern(`tickets:admin:detail:${id}`);

  await savedMsg.populate('author', 'username email profilePicture');

  await writeAudit(req, 'admin.ticket.reply', 'ticket', t._id.toString(), {
    isInternal,
    messagePreview: body.substring(0, 50),
  });

  return { ok: true, message: savedMsg, status: t.status };
};

module.exports = {
  getMessages,
  addMessage,
};
