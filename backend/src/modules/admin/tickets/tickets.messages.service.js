const mongoose = require('mongoose');
const Ticket = require('../../../models/Ticket');
const TicketMessage = require('../../../models/TicketMessage');
const { buildIdFilter, isValidPublicId } = require('../../../utils/publicId');
const AppError = require('../../../utils/AppError');
const { acquireLock, releaseLock, deleteCache, deleteCachePattern, publishEvent } = require('../../../lib/redis');
const { writeAudit } = require('../../../middleware/audit');
const { sendMailTemplate } = require('../../../lib/mail');
const avatarService = require('../../../services/avatarService');

function extractAdminId(req) {
  return (req.user && (req.user.publicId || req.user.sub || req.user.userId || req.user.id)) || null;
}

const getMessages = async (id, queryParam = {}) => {
  const limit = parseInt(queryParam.limit, 10) || 50;
  const before = queryParam.before;
  const since = queryParam.since;

  const ticketDoc = await Ticket.findOne(buildIdFilter(id)).select('_id publicId').lean();
  if (!ticketDoc) throw AppError.notFound('Ticket not found', 'ERR_TICKET_NOT_FOUND');

  const query = { ticket: ticketDoc._id };
  if (before && isValidPublicId(before, 'message')) {
    const bMsg = await TicketMessage.findOne({ publicId: before }).select('_id').lean();
    if (bMsg) query._id = { $lt: bMsg._id };
  }
  if (since && isValidPublicId(since, 'message')) {
    const sMsg = await TicketMessage.findOne({ publicId: since }).select('_id').lean();
    if (sMsg) query._id = { ...query._id, $gt: sMsg._id };
  }

  const messages = await TicketMessage.find(query)
    .select('publicId ticket author authorRole body internal createdAt')
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate('author', 'publicId username email profilePicture')
    .lean();

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  const publicTicketId = ticketDoc.publicId;
  const mappedMessages = messages.reverse().map((m) => {
    const publicMsgId = m.publicId;
    let author = m.author;
    if (author && typeof author === 'object') {
      const authorPublicId = author.publicId;
      const { _id: _aid, publicId: _apid, ...rawAuthor } = author;
      author = {
        ...rawAuthor,
        id: authorPublicId,
        profilePicture: avatarService.resolveAvatar(author),
      };
    }
    const { _id: _mid, publicId: _mpid, __v: _version, ...msgData } = m;
    return {
      ...msgData,
      id: publicMsgId,
      ticket: publicTicketId,
      author,
    };
  });

  return {
    messages: mappedMessages,
    hasMore,
  };
};

const addMessage = async (id, data, req) => {
  const adminId = extractAdminId(req);
  if (!adminId) throw AppError.unauthorized('Authentication required', 'ERR_UNAUTHORIZED');

  const { body, internal } = data || {};

  const lockKey = `ticket:mutation:${id}`;
  const lockToken = await acquireLock(lockKey, 5000);
  if (!lockToken) {
    throw AppError.tooManyRequests('Message send in progress, please wait', 'ERR_TICKET_RATE_LIMIT');
  }

  try {
    const t = await Ticket.findOne(buildIdFilter(id)).populate('user', 'email username publicId');
    if (!t) throw AppError.notFound('Ticket not found', 'ERR_TICKET_NOT_FOUND');
    if (t.deletedByUser) throw AppError.forbidden('Ticket is deleted', 'ERR_TICKET_DELETED');

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
      const capturedOwnerEmail = t.user?.email;
      const capturedOwnerUsername = t.user?.username;
      const capturedTitle = t.title;
      const capturedCategory = t.category;
      const capturedPriority = t.priority;
      const capturedStatus = t.status;
      const capturedTicketId = t.publicId;
      const capturedBody = body;

      setImmediate(async () => {
        try {
          if (capturedOwnerEmail) {
            let frontendHost = process.env.FRONTEND_URL || '';
            if (frontendHost && !frontendHost.startsWith('http')) frontendHost = `https://${frontendHost}`;

            let statusBg = '#2b2512';
            let statusColor = '#fde047';
            let statusBorder = '#453413';
            if (capturedStatus === 'open') {
              statusBg = '#102a1d';
              statusColor = '#86efac';
              statusBorder = '#144026';
            } else if (capturedStatus === 'resolved') {
              statusBg = '#18253a';
              statusColor = '#93c5fd';
              statusBorder = '#1a396b';
            } else if (capturedStatus === 'closed') {
              statusBg = '#303030';
              statusColor = '#AAAAAA';
              statusBorder = '#404040';
            }

            await sendMailTemplate({
              to: capturedOwnerEmail,
              templateKey: 'ticketReply',
              data: {
                username: capturedOwnerUsername,
                title: capturedTitle,
                snippet: String(capturedBody).slice(0, 200),
                ticketId: capturedTicketId,
                category: String(capturedCategory).charAt(0).toUpperCase() + String(capturedCategory).slice(1),
                priority: String(capturedPriority).charAt(0).toUpperCase() + String(capturedPriority).slice(1),
                status: String(capturedStatus).charAt(0).toUpperCase() + String(capturedStatus).slice(1),
                statusBg,
                statusColor,
                statusBorder,
                frontendUrl: frontendHost,
              },
            });
          }
        } catch (mailErr) {
          await writeAudit(null, 'ticket.email.send_failed', 'ticket', capturedTicketId, { error: mailErr.message, stage: 'admin_reply' }).catch(() => {});
        }
      });
    }

    const uStr = t.user?.publicId || String(t.user?._id || t.user || '');
    await Promise.allSettled([
      deleteCache('tickets:admin:list::::::newest:1:10'),
      deleteCache('tickets:admin:list::::::newest:1:20'),
      deleteCache('tickets:admin:list::::::newest:1:50'),
      deleteCache('tickets:admin:list::open::::newest:1:10'),
      deleteCache('tickets:admin:list::in_progress::::newest:1:10'),
      deleteCache('tickets:admin:list::closed::::newest:1:10'),
      deleteCache('tickets:admin:counts:all'),
      deleteCachePattern('tickets:admin:list:*'),
      deleteCachePattern('tickets:admin:counts:*'),
      deleteCache(`tickets:mine:${uStr}:1:10::::::`),
      deleteCache(`tickets:mine:${uStr}:1:20::::::`),
      deleteCache(`tickets:mine:${uStr}:1:50::::::`),
      deleteCache(`tickets:mine:${uStr}:1:10:open:::::`),
      deleteCache(`tickets:mine:${uStr}:1:10:closed:::::`),
      deleteCachePattern(`tickets:mine:${uStr}:*`),
      deleteCache(`tickets:user:counts:${uStr}`),
      deleteCache(`tickets:admin:detail:${id}`),
      deleteCache(`tickets:detail:${id}`),
      deleteCache(`tickets:messages:${id}:public`),
      deleteCache(`tickets:messages:${id}:admin`),
    ]);

    await savedMsg.populate('author', 'publicId username email profilePicture');
    const publicMsgId = savedMsg.publicId;
    const publicTicketId = t.publicId;
    const rawMsg = savedMsg.toObject ? savedMsg.toObject() : { ...savedMsg };
    let author = rawMsg.author;
    if (author && typeof author === 'object') {
      const authorPublicId = author.publicId;
      const { _id: _aid, publicId: _apid, ...rawAuthor } = author;
      author = {
        ...rawAuthor,
        id: authorPublicId,
        profilePicture: avatarService.resolveAvatar(author),
      };
    }
    const { _id: _mid, publicId: _mpid, __v: _version, ...msgData } = rawMsg;
    const msgObj = {
      ...msgData,
      id: publicMsgId,
      ticket: publicTicketId,
      author,
    };

    if (!isInternal) {
      await publishEvent(`ticket:${publicTicketId}`, {
        type: 'TICKET_MESSAGE',
        ticketId: publicTicketId,
        message: msgObj,
      });
      await publishEvent(`ticket:${publicTicketId}`, {
        type: 'TICKET_UPDATED',
        ticketId: publicTicketId,
        status: t.status,
        priority: t.priority,
        updatedAt: t.updatedAt,
      });
      await publishEvent(`ticket:${publicTicketId}`, {
        type: 'TICKET_STATUS',
        ticketId: publicTicketId,
        status: t.status,
      });
    }

    await writeAudit(req, 'admin.ticket.reply', 'ticket', publicTicketId, {
      isInternal,
      subject: t.title,
      targetUserId: isInternal ? null : (t.user?.publicId || null),
      messagePreview: body.substring(0, 50),
    });

    return { ok: true, message: msgObj, status: t.status };
  } finally {
    if (lockToken) {
      await releaseLock(lockKey, lockToken);
    }
  }
};

module.exports = {
  getMessages,
  addMessage,
};
