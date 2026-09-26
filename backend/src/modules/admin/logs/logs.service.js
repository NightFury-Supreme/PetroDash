const AuditLog = require('../../../models/AuditLog');
const User = require('../../../models/User');
const Server = require('../../../models/Server');
const Ticket = require('../../../models/Ticket');
const { getCache, setCache } = require('../../../lib/redis');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getLogs(parsedQuery) {
  const { page, pageSize, q, action, actorId, resourceType, requestId, severity, sortBy } = parsedQuery;

  const filterConditions = [];

  if (q && typeof q === 'string') {
    const escapedQ = escapeRegex(q);
    const qOrConditions = [
      { action: { $regex: escapedQ, $options: 'i' } },
      { resourceType: { $regex: escapedQ, $options: 'i' } },
      { requestId: { $regex: escapedQ, $options: 'i' } },
      { ip: { $regex: escapedQ, $options: 'i' } },
      { actorUsername: { $regex: escapedQ, $options: 'i' } },
    ];

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(q);
    if (isObjectId) {
      qOrConditions.push({ actorId: q });
      qOrConditions.push({ resourceId: q });
      qOrConditions.push({ targetUserId: q });
      qOrConditions.push({ _id: q });
    }

    const [matchedUsers, matchedServers, matchedTickets] = await Promise.all([
      User.find(
        {
          $or: [
            { username: { $regex: escapedQ, $options: 'i' } },
            { email: { $regex: escapedQ, $options: 'i' } },
          ],
        },
        '_id'
      )
        .limit(20)
        .lean(),
      Server.find({ name: { $regex: escapedQ, $options: 'i' } }, '_id')
        .limit(20)
        .lean(),
      Ticket.find({ title: { $regex: escapedQ, $options: 'i' } }, '_id')
        .limit(20)
        .lean(),
    ]);

    if (matchedUsers.length > 0) {
      const userIds = matchedUsers.map((u) => u._id.toString());
      qOrConditions.push({ actorId: { $in: userIds } });
      qOrConditions.push({ resourceId: { $in: userIds } });
      qOrConditions.push({ targetUserId: { $in: userIds } });
    }

    if (matchedServers.length > 0) {
      const serverIds = matchedServers.map((s) => s._id.toString());
      qOrConditions.push({ resourceId: { $in: serverIds } });
    }

    if (matchedTickets.length > 0) {
      const ticketIds = matchedTickets.map((t) => t._id.toString());
      qOrConditions.push({ resourceId: { $in: ticketIds } });
    }

    filterConditions.push({ $or: qOrConditions });
  }

  if (action && typeof action === 'string') {
    filterConditions.push({ action: { $regex: escapeRegex(action), $options: 'i' } });
  }

  if (actorId && typeof actorId === 'string') {
    filterConditions.push({ actorId });
  }

  if (resourceType && typeof resourceType === 'string') {
    filterConditions.push({ resourceType: { $regex: escapeRegex(resourceType), $options: 'i' } });
  }

  if (requestId && typeof requestId === 'string') {
    filterConditions.push({ requestId });
  }

  if (severity && typeof severity === 'string') {
    filterConditions.push({ severity: severity.toUpperCase() });
  }

  const query = filterConditions.length > 0 ? { $and: filterConditions } : {};

  const limit = pageSize;
  const skip = (page - 1) * limit;

  const sortByParam = sortBy || 'date_desc';
  const cacheKey = `admin:logs:${page}:${pageSize}:${q || ''}:${action || ''}:${actorId || ''}:${resourceType || ''}:${requestId || ''}:${severity || ''}:${sortByParam}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  let sortObj;
  switch (sortByParam) {
    case 'date_asc':
    case 'oldest':
      sortObj = { createdAt: 1 };
      break;
    case 'action_asc':
      sortObj = { action: 1, createdAt: -1 };
      break;
    case 'action_desc':
      sortObj = { action: -1, createdAt: -1 };
      break;
    case 'type_asc':
      sortObj = { resourceType: 1, createdAt: -1 };
      break;
    case 'date_desc':
    case 'newest':
    default:
      sortObj = { createdAt: -1 };
      break;
  }

  const [list, total] = await Promise.all([
    AuditLog.find(query).sort(sortObj).skip(skip).limit(limit).lean().exec(),
    AuditLog.countDocuments(query).exec(),
  ]);

  const userIdsToFetch = new Set();
  const serverIdsToFetch = new Set();
  const ticketIdsToFetch = new Set();

  list.forEach((log) => {
    if (log.actorId && /^[0-9a-fA-F]{24}$/.test(String(log.actorId))) {
      userIdsToFetch.add(String(log.actorId));
    }
    if (log.targetUserId && /^[0-9a-fA-F]{24}$/.test(String(log.targetUserId))) {
      userIdsToFetch.add(String(log.targetUserId));
    }
    if (log.resourceType === 'user' && log.resourceId && /^[0-9a-fA-F]{24}$/.test(String(log.resourceId))) {
      userIdsToFetch.add(String(log.resourceId));
    }
    if (log.resourceType === 'server' && log.resourceId && /^[0-9a-fA-F]{24}$/.test(String(log.resourceId))) {
      serverIdsToFetch.add(String(log.resourceId));
    }
    if (log.resourceType === 'ticket' && log.resourceId && /^[0-9a-fA-F]{24}$/.test(String(log.resourceId))) {
      ticketIdsToFetch.add(String(log.resourceId));
    }
  });

  const [users, servers, tickets] = await Promise.all([
    userIdsToFetch.size ? User.find({ _id: { $in: [...userIdsToFetch] } }, 'username role').lean() : [],
    serverIdsToFetch.size ? Server.find({ _id: { $in: [...serverIdsToFetch] } }, 'name').lean() : [],
    ticketIdsToFetch.size ? Ticket.find({ _id: { $in: [...ticketIdsToFetch] } }, 'title').lean() : [],
  ]);

  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), { name: u.username, role: u.role }]));
  const serverMap = Object.fromEntries(servers.map((s) => [s._id.toString(), s.name]));
  const ticketMap = Object.fromEntries(tickets.map((t) => [t._id.toString(), t.title]));

  const enrichedList = list.map((log) => {
    const copy = { ...log };
    if (!copy.meta) copy.meta = {};

    const actorUser = userMap[String(copy.actorId)];
    if (actorUser) {
      copy.actorUsername = actorUser.name;
    } else if (!copy.actorUsername) {
      copy.actorUsername = String(copy.actorId || 'system');
    }

    if (copy.resourceType === 'user' && copy.resourceId && userMap[String(copy.resourceId)]) {
      copy.meta.targetName = userMap[String(copy.resourceId)].name;
      if (userMap[String(copy.resourceId)].role) {
        copy.meta.targetRole = userMap[String(copy.resourceId)].role;
      }
    }

    if (copy.resourceType === 'server' && copy.resourceId && serverMap[String(copy.resourceId)]) {
      copy.meta.targetName = serverMap[String(copy.resourceId)];
    }

    if (copy.resourceType === 'ticket' && copy.resourceId && ticketMap[String(copy.resourceId)]) {
      copy.meta.targetName = ticketMap[String(copy.resourceId)];
    }

    return copy;
  });

  const totalPages = Math.ceil(total / limit) || 1;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const result = {
    list: enrichedList,
    total,
    page,
    pageSize: limit,
    totalPages,
    hasNext,
    hasPrev,
  };

  await setCache(cacheKey, result, 30);
  return result;
}

module.exports = { getLogs };
