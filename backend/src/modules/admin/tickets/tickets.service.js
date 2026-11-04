const mongoose = require('mongoose');
const Ticket = require('../../../models/Ticket');
const User = require('../../../models/User');
const { getOrSetCache } = require('../../../lib/redis');
const { isValidEntityId, buildIdFilter, isValidPublicId, formatPublicEntity } = require('../../../utils/publicId');
const AppError = require('../../../utils/AppError');

const categoriesService = require('./tickets.categories.service');
const messagesService = require('./tickets.messages.service');
const mutationService = require('./tickets.mutation.service');

const getCounts = async () => {
  const countsCacheKey = 'tickets:admin:counts:all';
  return getOrSetCache(
    countsCacheKey,
    async () => {
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

      return structuredCounts;
    },
    60
  );
};

const listTickets = async (queryParam) => {
  const { q, status, priority, category, deleted, sort = 'updated_desc', page = '1', limit = '25' } = queryParam;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

  const cacheKey = `tickets:admin:list:${q || ''}:${status || ''}:${priority || ''}:${category || ''}:${deleted || ''}:${sort}:${pageNum}:${limitNum}`;

  return getOrSetCache(
    cacheKey,
    async () => {
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
        const raw = q.trim();
        const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = { $regex: escaped, $options: 'i' };

        const matchedUsers = await User.find(
          { $or: [{ username: searchRegex }, { email: searchRegex }] },
          { _id: 1 }
        )
          .limit(100)
          .lean();
        const matchedUserIds = matchedUsers.map((u) => u._id);

        const orConditions = [
          { title: searchRegex },
          { tags: { $elemMatch: searchRegex } },
          { category: searchRegex },
        ];

        const cleanId = raw.replace(/^ticket\s*#?\s*/i, '').replace(/^#\s*/, '').trim();
        if (isValidPublicId(cleanId, 'ticket')) {
          orConditions.push({ publicId: cleanId });
        } else if (/^tkt_[0-9a-f]{1,20}$/i.test(cleanId)) {
          orConditions.push({ publicId: { $regex: cleanId, $options: 'i' } });
        }

        if (cleanId && cleanId !== raw) {
          const cleanEscaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          orConditions.push({ title: { $regex: cleanEscaped, $options: 'i' } });
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

      const [total, tickets] = await Promise.all([
        Ticket.countDocuments(query),
        Ticket.find(query)
          .select('publicId user assignee title category priority status tags deletedByUser lastUserActivityAt lastAdminReplyAt closedAt createdAt updatedAt')
          .sort(sortObj)
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .populate('user', 'publicId username email profilePicture oauthProviders')
          .lean(),
      ]);

      const mappedTickets = tickets.map((t) => {
        const publicId = t.publicId;
        const mappedUser = t.user && typeof t.user === 'object' ? {
          username: t.user.username,
          email: t.user.email,
          id: t.user.publicId,
        } : t.user;
        const mappedAssignee = t.assignee && typeof t.assignee === 'object' ? {
          username: t.assignee.username,
          email: t.assignee.email,
          id: t.assignee.publicId,
        } : t.assignee;
        const { _id: _dbId, __v: _version, publicId: _pid, ...ticketData } = t;
        return {
          ...ticketData,
          id: publicId,
          user: mappedUser,
          assignee: mappedAssignee,
        };
      });

      return { tickets: mappedTickets, total, page: pageNum, pages: Math.ceil(total / limitNum) };
    },
    30
  );
};

const getTicket = async (id) => {
  if (!isValidEntityId(id, 'ticket')) {
    throw AppError.badRequest('Invalid ticket ID format', 'ERR_INVALID_ID');
  }

  const cacheKey = `tickets:admin:detail:${id}`;
  return getOrSetCache(
    cacheKey,
    async () => {
      const t = await Ticket.findOne(buildIdFilter(id))
        .select('publicId user assignee title category priority status tags deletedByUser lastUserActivityAt lastAdminReplyAt closedAt createdAt updatedAt')
        .populate('user', 'publicId username email')
        .populate('assignee', 'publicId username email')
        .lean();
      if (!t) throw AppError.notFound('Ticket not found', 'ERR_TICKET_NOT_FOUND');

      const formatted = formatPublicEntity(t);
      formatted.messages = [];
      return formatted;
    },
    30
  );
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
