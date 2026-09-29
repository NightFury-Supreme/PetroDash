/**
 * Admin Tickets Mutation Service
 * Handles update, delete, and notifications for tickets
 * Complies with ISO/IEC 25010 (Single Responsibility Principle)
 */

const mongoose = require('mongoose');
const Ticket = require('../../../models/Ticket');
const User = require('../../../models/User');
const { deleteCachePattern } = require('../../../lib/redis');
const AppError = require('../../../utils/AppError');
const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');
const { sendMailTemplate } = require('../../../lib/mail');

const updateTicket = async (id, data, req) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw AppError.badRequest('Invalid ticket ID format', 'ERR_INVALID_ID');
  }

  const { status, assignee, priority, tags, deletedByUser } = data || {};
  const t = await Ticket.findById(String(id));
  if (!t) throw AppError.notFound('Ticket not found', 'ERR_TICKET_NOT_FOUND');

  const originalTicket = t.toObject();
  let changed = false;

  if (status !== undefined && ['open', 'pending', 'resolved', 'closed'].includes(status)) {
    if (t.status === 'closed' && status === 'resolved') {
      throw AppError.badRequest('Cannot resolve a closed ticket. Please reopen it first.', 'ERR_CANNOT_RESOLVE_CLOSED');
    }

    if (t.status !== status && (status === 'resolved' || status === 'closed')) {
      try {
        const owner = await User.findById(t.user).lean();
        if (owner && owner.email) {
          let frontendHost = process.env.FRONTEND_URL || '';
          if (frontendHost && !frontendHost.startsWith('http')) frontendHost = `https://${frontendHost}`;
          await sendMailTemplate({
            to: owner.email,
            templateKey: status === 'resolved' ? 'ticketResolved' : 'ticketClosed',
            data: {
              username: owner.username,
              title: t.title,
              ticketId: String(t._id),
              category: String(t.category).charAt(0).toUpperCase() + String(t.category).slice(1),
              priority: String(t.priority).charAt(0).toUpperCase() + String(t.priority).slice(1),
              frontendUrl: frontendHost,
            },
          });
        }
      } catch (_) {}
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
    t.assignee = assignee ? new mongoose.Types.ObjectId(String(assignee)) : null;
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

    await deleteCachePattern('tickets:admin:list:*');
    await deleteCachePattern('tickets:admin:counts:*');
    await deleteCachePattern(`tickets:mine:${t.user}:*`);
    await deleteCachePattern(`tickets:admin:detail:${id}`);

    const changes = {};
    if (status !== undefined && status !== originalTicket.status) changes.status = { old: originalTicket.status, new: status };
    if (priority !== undefined && priority !== originalTicket.priority) changes.priority = { old: originalTicket.priority, new: priority };
    if (assignee !== undefined) {
      const oldAssignee = originalTicket.assignee ? originalTicket.assignee.toString() : null;
      const newAssignee = assignee ? String(assignee) : null;
      if (oldAssignee !== newAssignee) changes.assignee = { old: oldAssignee, new: newAssignee };
    }
    if (Array.isArray(tags)) changes.tags = { old: originalTicket.tags || [], new: tags.slice(0, 20) };
    if (typeof deletedByUser === 'boolean' && deletedByUser !== originalTicket.deletedByUser) {
      changes.deletedByUser = { old: originalTicket.deletedByUser, new: deletedByUser };
    }

    await writeAudit(req, 'admin.ticket.update', 'ticket', t._id.toString(), {
      changes,
      subject: t.title,
      targetUserId: t.user.toString(),
    });

    await logUserActivity(
      req,
      'admin.ticket.update',
      {
        ticketId: t._id.toString(),
        subject: t.title,
        title: t.title,
        updatedByAdmin: true,
        changes: Object.keys(changes).length > 0 ? changes : undefined,
      },
      t.user.toString()
    );
  }

  return { ok: true, status: t.status, priority: t.priority };
};

const deleteTicket = async (id, req) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw AppError.badRequest('Invalid ticket ID format', 'ERR_INVALID_ID');
  }

  const result = await Ticket.findByIdAndDelete(String(id));
  if (!result) throw AppError.notFound('Ticket not found', 'ERR_TICKET_NOT_FOUND');

  await deleteCachePattern('tickets:admin:list:*');
  await deleteCachePattern('tickets:admin:counts:*');
  if (result.user) await deleteCachePattern(`tickets:mine:${result.user}:*`);
  await deleteCachePattern(`tickets:admin:detail:${id}`);

  await writeAudit(req, 'admin.ticket.delete', 'ticket', result._id.toString(), {
    title: result.title,
    subject: result.title,
    targetUserId: result.user ? result.user.toString() : null,
  });

  await logUserActivity(
    req,
    'admin.ticket.delete',
    {
      ticketId: result._id.toString(),
      subject: result.title,
      title: result.title,
    },
    result.user ? result.user.toString() : null
  );

  return { ok: true };
};

module.exports = {
  updateTicket,
  deleteTicket,
};
