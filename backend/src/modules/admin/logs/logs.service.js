const AuditLog = require('../../../models/AuditLog');
const User = require('../../../models/User');
const Server = require('../../../models/Server');
const Ticket = require('../../../models/Ticket');
const { getCache, setCache } = require('../../../lib/redis');
const { formatPublicEntity, isValidPublicId } = require('../../../utils/publicId');

const CACHE_TTL_SECONDS = 30;
const EXCLUDED_NOISE_ACTIONS = [
  'earn.session.start',
  'earn.claim',
  'auth.oauth.discord.initiated',
  'auth.oauth.google.initiated',
  'auth.password.reset.requested',
  'auth.email.verify.resent',
  'auth.2fa.setup_initiated',
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getLogs(parsedQuery) {
  const { page, pageSize, q, action, actorId, resourceType, requestId, severity, sortBy } = parsedQuery;

  const sortByParam = sortBy || 'date_desc';
  const cacheKey = `admin:logs:${page}:${pageSize}:${q || ''}:${action || ''}:${actorId || ''}:${resourceType || ''}:${requestId || ''}:${severity || ''}:${sortByParam}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

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

    if (isValidPublicId(q)) {
      qOrConditions.push({ publicId: q });
      qOrConditions.push({ resourceId: q });
      qOrConditions.push({ actorId: q });
      qOrConditions.push({ targetUserId: q });
    }

    const [matchedUsers, matchedServers, matchedTickets] = await Promise.all([
      User.find({
        $or: [
          { username: { $regex: escapedQ, $options: 'i' } },
          { email: { $regex: escapedQ, $options: 'i' } },
          { publicId: q },
        ],
      })
        .select('publicId')
        .lean(),
      Server.find({ $or: [{ name: { $regex: escapedQ, $options: 'i' } }, { publicId: q }] })
        .select('publicId')
        .lean(),
      Ticket.find({ $or: [{ title: { $regex: escapedQ, $options: 'i' } }, { publicId: q }] })
        .select('publicId')
        .lean(),
    ]);

    if (matchedUsers.length > 0) {
      const userIds = matchedUsers.map((u) => u.publicId).filter(Boolean);
      qOrConditions.push({ actorId: { $in: userIds } });
      qOrConditions.push({ targetUserId: { $in: userIds } });
      qOrConditions.push({ resourceId: { $in: userIds } });
    }

    if (matchedServers.length > 0) {
      const serverIds = matchedServers.map((s) => s.publicId).filter(Boolean);
      qOrConditions.push({ resourceId: { $in: serverIds } });
    }

    if (matchedTickets.length > 0) {
      const ticketIds = matchedTickets.map((t) => t.publicId).filter(Boolean);
      qOrConditions.push({ resourceId: { $in: ticketIds } });
    }

    filterConditions.push({ $or: qOrConditions });
  }

  if (action && typeof action === 'string') {
    filterConditions.push({ action: { $regex: escapeRegex(action), $options: 'i' } });
  }

  if (actorId && typeof actorId === 'string') {
    if (actorId === 'system' || actorId.startsWith('usr_')) {
      filterConditions.push({ actorId });
    } else {
      const userDoc = await User.findOne({ username: actorId }).select('publicId').lean();
      filterConditions.push({ actorId: userDoc ? userDoc.publicId : actorId });
    }
  }

  if (resourceType && typeof resourceType === 'string') {
    filterConditions.push({ resourceType: { $regex: escapeRegex(resourceType), $options: 'i' } });
  }

  if (requestId && typeof requestId === 'string') {
    filterConditions.push({ requestId });
  }

  if (severity && typeof severity === 'string' && severity.toUpperCase() !== 'ALL') {
    filterConditions.push({ severity: severity.toUpperCase() });
  }

  filterConditions.push({ action: { $nin: EXCLUDED_NOISE_ACTIONS } });

  const query = filterConditions.length > 0 ? { $and: filterConditions } : {};
  const skip = (page - 1) * pageSize;
  const limit = pageSize;

  let sortObj = { createdAt: -1 };
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
    AuditLog.find(query)
      .select('publicId actorId actorRole actorUsername action severity category requestId sessionId resourceType resourceId targetUserId meta ip userAgent location method path statusCode success durationMs responsePreview createdAt')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    AuditLog.countDocuments(query).exec(),
  ]);

  const userIdsToFetch = new Set();
  const serverIdsToFetch = new Set();
  const ticketIdsToFetch = new Set();

  list.forEach((log) => {
    if (log.actorId) {
      userIdsToFetch.add(String(log.actorId));
    }
    if (log.targetUserId) {
      userIdsToFetch.add(String(log.targetUserId));
    }
    if (log.resourceType === 'user' && log.resourceId) {
      userIdsToFetch.add(String(log.resourceId));
    }
    if (log.resourceType === 'server' && log.resourceId) {
      serverIdsToFetch.add(String(log.resourceId));
    }
    if (log.resourceType === 'ticket' && log.resourceId) {
      ticketIdsToFetch.add(String(log.resourceId));
    }
  });

  const [users, servers, tickets] = await Promise.all([
    userIdsToFetch.size
      ? User.find({ publicId: { $in: [...userIdsToFetch] } })
          .select('username role publicId')
          .lean()
      : [],
    serverIdsToFetch.size
      ? Server.find({ publicId: { $in: [...serverIdsToFetch] } })
          .select('name publicId')
          .lean()
      : [],
    ticketIdsToFetch.size
      ? Ticket.find({ publicId: { $in: [...ticketIdsToFetch] } })
          .select('title publicId')
          .lean()
      : [],
  ]);

  const userMap = {};
  users.forEach((u) => {
    const val = { name: u.username, role: u.role, publicId: u.publicId };
    if (u.publicId) userMap[u.publicId] = val;
  });

  const serverMap = {};
  servers.forEach((s) => {
    const val = { name: s.name, publicId: s.publicId };
    if (s.publicId) serverMap[s.publicId] = val;
  });

  const ticketMap = {};
  tickets.forEach((t) => {
    const val = { title: t.title, publicId: t.publicId };
    if (t.publicId) ticketMap[t.publicId] = val;
  });

  const enrichedList = list.map((log) => {
    const copy = { ...log };
    if (!copy.meta) copy.meta = {};

    const actorUser = userMap[String(copy.actorId)];
    if (actorUser) {
      copy.actorUsername = actorUser.name;
      copy.actorId = actorUser.publicId;
    } else if (!copy.actorUsername) {
      copy.actorUsername = String(copy.actorId || 'system');
    }

    if (copy.resourceType === 'user' && copy.resourceId && userMap[String(copy.resourceId)]) {
      copy.meta.targetName = userMap[String(copy.resourceId)].name;
      copy.resourceId = userMap[String(copy.resourceId)].publicId;
      if (userMap[String(copy.resourceId)].role) {
        copy.meta.targetRole = userMap[String(copy.resourceId)].role;
      }
    } else if (copy.targetUserId && userMap[String(copy.targetUserId)] && !copy.meta.targetName) {
      copy.meta.targetName = userMap[String(copy.targetUserId)].name;
      copy.targetUserId = userMap[String(copy.targetUserId)].publicId;
      if (userMap[String(copy.targetUserId)].role) {
        copy.meta.targetRole = userMap[String(copy.targetUserId)].role;
      }
    }

    if (copy.resourceType === 'server' && copy.resourceId && serverMap[String(copy.resourceId)]) {
      copy.meta.targetName = serverMap[String(copy.resourceId)].name;
      copy.resourceId = serverMap[String(copy.resourceId)].publicId;
    }

    if (copy.resourceType === 'ticket' && copy.resourceId && ticketMap[String(copy.resourceId)]) {
      copy.meta.targetName = ticketMap[String(copy.resourceId)].title;
      copy.resourceId = ticketMap[String(copy.resourceId)].publicId;
    }

    let clientIp = copy.ip;
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      clientIp = '127.0.0.1';
    } else if (typeof clientIp === 'string' && clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }
    copy.ip = clientIp;
    copy.location = copy.location || copy.meta?.location || null;

    return formatPublicEntity(copy, 'auditLog');
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

  await setCache(cacheKey, result, CACHE_TTL_SECONDS);
  return result;
}

module.exports = { getLogs };
