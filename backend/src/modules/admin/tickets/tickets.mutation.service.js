const Ticket = require('../../../models/Ticket');
const TicketMessage = require('../../../models/TicketMessage');
const User = require('../../../models/User');
const { acquireLock, releaseLock, deleteCache, deleteCachePattern, publishEvent } = require('../../../lib/redis');
const AppError = require('../../../utils/AppError');
const { writeAudit } = require('../../../middleware/audit');
const { sendMailTemplate } = require('../../../lib/mail');
const { isValidEntityId, buildIdFilter } = require('../../../utils/publicId');

const updateTicket = async (id, data, req) => {
  if (!isValidEntityId(id, 'ticket')) {
    throw AppError.badRequest('Invalid ticket ID format', 'ERR_INVALID_ID');
  }

  const lockKey = `ticket:mutation:${id}`;
  const lockToken = await acquireLock(lockKey, 5000);
  if (!lockToken) {
    throw AppError.tooManyRequests('Ticket update in progress, please wait', 'ERR_TICKET_RATE_LIMIT');
  }

  try {
    const { status, assignee, priority, tags, deletedByUser } = data || {};
    const t = await Ticket.findOne(buildIdFilter(id)).populate('user', 'email username publicId');
    if (!t) throw AppError.notFound('Ticket not found', 'ERR_TICKET_NOT_FOUND');

    const originalTicket = t.toObject();
    let changed = false;

    if (status !== undefined && ['open', 'pending', 'resolved', 'closed'].includes(status)) {
      if (t.status === 'closed' && status === 'resolved') {
        throw AppError.badRequest('Cannot resolve a closed ticket. Please reopen it first.', 'ERR_CANNOT_RESOLVE_CLOSED');
      }

      if (t.status !== status && (status === 'resolved' || status === 'closed')) {
        const capturedOwnerEmail = t.user?.email;
        const capturedOwnerUsername = t.user?.username;
        const capturedTitle = t.title;
        const capturedCategory = t.category;
        const capturedPriority = t.priority;
        const capturedTicketId = t.publicId;
        const capturedStatus = status;

        setImmediate(async () => {
          try {
            if (capturedOwnerEmail) {
              let frontendHost = process.env.FRONTEND_URL || '';
              if (frontendHost && !frontendHost.startsWith('http')) frontendHost = `https://${frontendHost}`;
              await sendMailTemplate({
                to: capturedOwnerEmail,
                templateKey: capturedStatus === 'resolved' ? 'ticketResolved' : 'ticketClosed',
                data: {
                  username: capturedOwnerUsername,
                  title: capturedTitle,
                  ticketId: capturedTicketId,
                  category: String(capturedCategory).charAt(0).toUpperCase() + String(capturedCategory).slice(1),
                  priority: String(capturedPriority).charAt(0).toUpperCase() + String(capturedPriority).slice(1),
                  frontendUrl: frontendHost,
                },
              });
            }
          } catch (mailErr) {
            await writeAudit(null, 'ticket.email.send_failed', 'ticket', capturedTicketId, { error: mailErr.message, stage: 'status_update' }).catch(() => {});
          }
        });
      }

      t.status = status;
      if (status === 'closed') t.closedAt = t.closedAt || new Date();
      changed = true;
    }

    if (priority !== undefined && ['low', 'medium', 'high'].includes(priority)) {
      t.priority = priority;
      changed = true;
    }

    if (assignee !== undefined) {
      if (assignee) {
        const assigneeDoc = await User.findOne(buildIdFilter(assignee)).select('_id').lean();
        t.assignee = assigneeDoc ? assigneeDoc._id : null;
      } else {
        t.assignee = null;
      }
      changed = true;
    }

    if (Array.isArray(tags)) {
      t.tags = tags.slice(0, 20);
      changed = true;
    }

    if (typeof deletedByUser === 'boolean') {
      t.deletedByUser = deletedByUser;
      changed = true;
    }

    if (changed) {
      t.updatedAt = new Date();
      await t.save();

      const publicTicketId = t.publicId;
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
        deleteCache(`tickets:admin:detail:${publicTicketId}`),
        deleteCache(`tickets:detail:${publicTicketId}`),
      ]);

      const updatePayload = {
        type: 'TICKET_UPDATED',
        ticketId: publicTicketId,
        status: t.status,
        priority: t.priority,
        assignee: t.assignee ? String(t.assignee) : null,
        tags: t.tags || [],
        deletedByUser: t.deletedByUser,
        updatedAt: t.updatedAt,
      };
      await publishEvent(`ticket:${publicTicketId}`, updatePayload);

      if (status !== undefined) {
        await publishEvent(`ticket:${publicTicketId}`, { type: 'TICKET_STATUS', ticketId: publicTicketId, status: t.status });
      }

      const changes = {};
      if (status !== undefined && status !== originalTicket.status) changes.status = { old: originalTicket.status, new: status };
      if (priority !== undefined && priority !== originalTicket.priority) changes.priority = { old: originalTicket.priority, new: priority };
      if (assignee !== undefined) {
        const oldAssignee = originalTicket.assignee ? originalTicket.assignee.toString() : null;
        const newAssignee = assignee ? String(assignee) : null;
        if (oldAssignee !== newAssignee) changes.assignee = { old: oldAssignee, new: newAssignee };
      }
      if (Array.isArray(tags) && JSON.stringify(originalTicket.tags || []) !== JSON.stringify(tags.slice(0, 20))) {
        changes.tags = { old: originalTicket.tags || [], new: tags.slice(0, 20) };
      }
      if (typeof deletedByUser === 'boolean' && deletedByUser !== originalTicket.deletedByUser) {
        changes.deletedByUser = { old: originalTicket.deletedByUser, new: deletedByUser };
      }

      await writeAudit(req, 'admin.ticket.update', 'ticket', publicTicketId, {
        changes,
        subject: t.title,
        targetUserId: t.user?.publicId || null,
      });
    }

    return { ok: true, status: t.status, priority: t.priority };
  } finally {
    if (lockToken) {
      await releaseLock(lockKey, lockToken);
    }
  }
};

const deleteTicket = async (id, req) => {
  if (!isValidEntityId(id, 'ticket')) {
    throw AppError.badRequest('Invalid ticket ID format', 'ERR_INVALID_ID');
  }

  const lockKey = `ticket:mutation:${id}`;
  const lockToken = await acquireLock(lockKey, 5000);
  if (!lockToken) {
    throw AppError.tooManyRequests('Ticket deletion in progress, please wait', 'ERR_TICKET_RATE_LIMIT');
  }

  try {
    const result = await Ticket.findOneAndDelete(buildIdFilter(id)).populate('user', 'publicId');
    if (!result) throw AppError.notFound('Ticket not found', 'ERR_TICKET_NOT_FOUND');

    await TicketMessage.deleteMany({ ticket: result._id });

    const publicId = result.publicId;

    const uStr = result.user?.publicId || null;
    const userOps = uStr
      ? [
          deleteCache(`tickets:mine:${uStr}:1:10::::::`),
          deleteCache(`tickets:mine:${uStr}:1:20::::::`),
          deleteCache(`tickets:mine:${uStr}:1:50::::::`),
          deleteCache(`tickets:mine:${uStr}:1:10:open:::::`),
          deleteCache(`tickets:mine:${uStr}:1:10:closed:::::`),
          deleteCachePattern(`tickets:mine:${uStr}:*`),
          deleteCache(`tickets:user:counts:${uStr}`),
        ]
      : [];

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
      ...userOps,
      deleteCache(`tickets:admin:detail:${publicId}`),
      deleteCache(`tickets:detail:${publicId}`),
      deleteCache(`tickets:messages:${publicId}:public`),
      deleteCache(`tickets:messages:${publicId}:admin`),
      deleteCache(`mentions:ticket:${publicId}`),
      deleteCache('tickets:admin:categories:usage'),
    ]);

    await writeAudit(req, 'admin.ticket.delete', 'ticket', publicId, {
      title: result.title,
      subject: result.title,
      targetUserId: result.user?.publicId || null,
    });

    await publishEvent(`ticket:${publicId}`, { type: 'TICKET_UPDATED', ticketId: publicId, deleted: true });

    return { ok: true };
  } finally {
    if (lockToken) {
      await releaseLock(lockKey, lockToken);
    }
  }
};

module.exports = {
  updateTicket,
  deleteTicket,
};
