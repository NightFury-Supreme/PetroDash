/**
 * Admin Tickets Main Service
 * Complies with ISO/IEC 25010 (Single Responsibility, Clean Architecture)
 */

const Ticket = require('../../../models/Ticket');
const User = require('../../../models/User');
const { getCache, setCache } = require('../../../lib/redis');
const AppError = require('../../../utils/AppError');

const categoriesService = require('./tickets.categories.service');
const messagesService = require('./tickets.messages.service');
const mutationService = require('./tickets.mutation.service');

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
    }
    if (structuredCounts.byStatus[stat] !== undefined && !isDeleted) {
      structuredCounts.byStatus[stat] += count;
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
    throw AppError.badRequest('Invalid ticket ID format', 'ERR_INVALID_ID');
  }

  const cacheKey = `tickets:admin:detail:${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const t = await Ticket.findById(String(id))
    .populate('user', 'username email')
    .populate('assignee', 'username email')
    .lean();
  if (!t) throw AppError.notFound('Ticket not found', 'ERR_TICKET_NOT_FOUND');

  t.messages = [];
  await setCache(cacheKey, t, 30);
  return t;
};

module.exports = {
  getCounts,
  listTickets,
  getTicket,
  updateTicket: mutationService.updateTicket,
  deleteTicket: mutationService.deleteTicket,
  getMessages: messagesService.getMessages,
  addMessage: messagesService.addMessage,
  getCategories: categoriesService.getCategories,
  getCategoryUsage: categoriesService.getCategoryUsage,
  updateCategories: categoriesService.updateCategories,
};
