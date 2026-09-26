/**
 * Admin Tickets Main Service
 * Complies with ISO/IEC 25010 (Single Responsibility, Clean Architecture)
 */

const mongoose = require('mongoose');
const Ticket = require('../../../models/Ticket');
const User = require('../../../models/User');
const { getCache, setCache, deleteCachePattern } = require('../../../lib/redis');
const AppError = require('../../../utils/AppError');
const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');

const categoriesService = require('./tickets.categories.service');
const messagesService = require('./tickets.messages.service');

const getCounts = async () => {
  const countsCacheKey = 'tickets:admin:counts:all';
  const cachedCounts = await getCache(countsCacheKey);
  if (cachedCounts) return cachedCounts;

  const pipeline = [
    {
      $group: {
        _id: {
          category: '$category',
          status: '$status',
          deletedByUser: '$deletedByUser',
        },
        count: { $sum: 1 },
      },
    },
  ];

  const results = await Ticket.aggregate(pipeline);

  const structuredCounts = {
    total: 0,
    byStatus: { open: 0, pending: 0, resolved: 0, closed: 0 },
    byCategory: {},
    deleted: 0,
  };

  for (const r of results) {
    const cat = r._id.category || 'general';
    const stat = r._id.status;
    const isDeleted = r._id.deletedByUser === true;
    const count = r.count;

    if (isDeleted) {
      structuredCounts.deleted += count;
    } else {
      structuredCounts.total += count;
      if (structuredCounts.byStatus[stat] !== undefined) {
        structuredCounts.byStatus[stat] += count;
      }
    }

    if (!structuredCounts.byCategory[cat]) {
      structuredCounts.byCategory[cat] = { all: 0, open: 0, pending: 0, resolved: 0, closed: 0, deleted: 0 };
    }

    if (isDeleted) {
      structuredCounts.byCategory[cat].deleted += count;
    } else {
      structuredCounts.byCategory[cat].all += count;
      if (structuredCounts.byCategory[cat][stat] !== undefined) {
        structuredCounts.byCategory[cat][stat] += count;
      }
    }
  }

  await setCache(countsCacheKey, structuredCounts, 60);
  return structuredCounts;
};

const listTickets = async (queryParam) => {
  const { q, status, priority, category, deleted, sort = 'updated_desc', page = '1', limit = '25' } = queryParam;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

  const query = {};
  if (deleted === '1' || deleted === 'true') {
    query.deletedByUser = true;
  } else if (deleted !== 'all') {
    query.deletedByUser = { $ne: true };
  }
  if (status && ['open', 'pending', 'resolved', 'closed'].includes(status)) {
    query.status = { $eq: status };
  }
  if (priority && ['low', 'medium', 'high'].includes(priority)) {
    query.priority = { $eq: priority };
  }
  if (category && typeof category === 'string' && category.trim()) {
    query.category = category.trim();
  }
  if (q && typeof q === 'string' && q.trim()) {
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = { $regex: escaped, $options: 'i' };

    const matchedUsers = await User.find(
      { $or: [{ username: searchRegex }, { email: searchRegex }] },
      { _id: 1 }
    ).lean();
    const matchedUserIds = matchedUsers.map((u) => u._id);

    const orConditions = [
      { title: searchRegex },
      { tags: { $elemMatch: searchRegex } },
      { category: searchRegex },
    ];

    if (/^[0-9a-fA-F]{24}$/.test(q.trim())) {
      orConditions.push({ _id: q.trim() });
    }

    if (matchedUserIds.length > 0) {
      orConditions.push({ user: { $in: matchedUserIds } });
    }

    query.$or = orConditions;
  }

  let sortObj = {};
  switch (sort) {
    case 'updated_asc':
      sortObj = { updatedAt: 1 };
      break;
    case 'created_desc':
      sortObj = { createdAt: -1 };
      break;
    case 'created_asc':
      sortObj = { createdAt: 1 };
      break;
    case 'priority_desc':
      sortObj = { priority: -1, updatedAt: -1 };
      break;
    case 'priority_asc':
      sortObj = { priority: 1, updatedAt: -1 };
      break;
    default:
      sortObj = { updatedAt: -1 };
  }

  const cacheKey = `tickets:admin:list:${q || ''}:${status || ''}:${priority || ''}:${category || ''}:${deleted || ''}:${sort}:${pageNum}:${limitNum}`;
  const cachedTickets = await getCache(cacheKey);
  if (cachedTickets) {
    return cachedTickets;
  }

  const total = await Ticket.countDocuments(query);
  const tickets = await Ticket.find(query)
    .select('-messages')
    .sort(sortObj)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .populate('user', 'username email profilePicture oauthProviders')
    .lean();

  const responseData = { tickets, total, page: pageNum, pages: Math.ceil(total / limitNum) };
  await setCache(cacheKey, responseData, 30);

  return responseData;
};

const getTicket = async (id) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new AppError('Invalid ticket ID format', 400, 'ERR_INVALID_ID');
  }

  const cacheKey = `tickets:admin:detail:${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const t = await Ticket.findById(String(id))
    .populate('user', 'username email')
    .populate('assignee', 'username email')
    .lean();
  if (!t) throw new AppError('Ticket not found', 404, 'ERR_TICKET_NOT_FOUND');

  t.messages = [];
  await setCache(cacheKey, t, 30);
  return t;
};

const updateTicket = async (id, data, req) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new AppError('Invalid ticket ID format', 400, 'ERR_INVALID_ID');
  }

  const { status, assignee, priority, tags, deletedByUser } = data || {};
  const t = await Ticket.findById(String(id));
  if (!t) throw new AppError('Ticket not found', 404, 'ERR_TICKET_NOT_FOUND');

  const originalTicket = t.toObject();
  let changed = false;

  if (status !== undefined && ['open', 'pending', 'resolved', 'closed'].includes(status)) {
    if (t.status === 'closed' && status === 'resolved') {
      throw new AppError('Cannot resolve a closed ticket. Please reopen it first.', 400, 'ERR_CANNOT_RESOLVE_CLOSED');
    }

    if (t.status !== status && (status === 'resolved' || status === 'closed')) {
      try {
        const owner = await User.findById(t.user).lean();
        if (owner && owner.email) {
          const { sendMailTemplate } = require('../../../lib/mail');
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

    await writeAudit(req, 'admin.ticket.update', 'ticket', t._id.toString(), { changes });

    await logUserActivity(
      null,
      'admin.ticket.update',
      {
        ticketId: t._id.toString(),
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
    throw new AppError('Invalid ticket ID format', 400, 'ERR_INVALID_ID');
  }

  const result = await Ticket.findByIdAndDelete(String(id));
  if (!result) throw new AppError('Ticket not found', 404, 'ERR_TICKET_NOT_FOUND');

  await deleteCachePattern('tickets:admin:list:*');
  await deleteCachePattern('tickets:admin:counts:*');
  if (result.user) await deleteCachePattern(`tickets:mine:${result.user}:*`);
  await deleteCachePattern(`tickets:admin:detail:${id}`);

  await writeAudit(req, 'admin.ticket.delete', 'ticket', result._id.toString(), { title: result.title });

  return { ok: true };
};

module.exports = {
  getCounts,
  listTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  getMessages: messagesService.getMessages,
  addMessage: messagesService.addMessage,
  getCategories: categoriesService.getCategories,
  getCategoryUsage: categoriesService.getCategoryUsage,
  updateCategories: categoriesService.updateCategories,
};
