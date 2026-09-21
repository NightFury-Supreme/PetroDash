const AuditLog = require('../../../models/AuditLog');
const User = require('../../../models/User');
const Server = require('../../../models/Server');
const { getCache, setCache } = require('../../../lib/redis');

async function getLogs(parsedQuery) {
  const { page, pageSize, action, actorId, resourceType, requestId, severity, sortBy } = parsedQuery;

  const query = {};
  
  if (action && typeof action === 'string') {
    query.action = { $regex: action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }
  
  if (actorId && typeof actorId === 'string') {
    query.actorId = actorId;
  }
  
  if (resourceType && typeof resourceType === 'string') {
    query.resourceType = { $regex: resourceType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }

  if (requestId && typeof requestId === 'string') {
    query.requestId = requestId;
  }

  if (severity && typeof severity === 'string') {
    query.severity = severity;
  }

  const limit = pageSize;
  const skip = (page - 1) * limit;

  const sortByParam = sortBy || 'newest';
  const cacheKey = `admin:logs:${page}:${pageSize}:${action || ''}:${actorId || ''}:${resourceType || ''}:${requestId || ''}:${severity || ''}:${sortByParam}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const sortObj = sortByParam === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

  const [list, total] = await Promise.all([
    AuditLog.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    AuditLog.countDocuments(query).exec()
  ]);

  const userIds = [...new Set(list.filter(l => l.resourceType === 'user' && l.resourceId).map(l => l.resourceId))];
  const serverIds = [...new Set(list.filter(l => l.resourceType === 'server' && l.resourceId).map(l => l.resourceId))];

  const [users, servers] = await Promise.all([
    userIds.length ? User.find({ _id: { $in: userIds } }, 'username role').lean() : [],
    serverIds.length ? Server.find({ _id: { $in: serverIds } }, 'name').lean() : []
  ]);

  const userMap = Object.fromEntries(users.map(u => [u._id.toString(), { name: u.username, role: u.role }]));
  const serverMap = Object.fromEntries(servers.map(s => [s._id.toString(), s.name]));

  const enrichedList = list.map(log => {
    const copy = { ...log };
    if (!copy.meta) copy.meta = {};
    if (copy.resourceType === 'user' && copy.resourceId && userMap[copy.resourceId]) {
      copy.meta.targetName = userMap[copy.resourceId].name;
      if (userMap[copy.resourceId].role) {
        copy.meta.targetRole = userMap[copy.resourceId].role;
      }
    }
    if (copy.resourceType === 'server' && copy.resourceId && serverMap[copy.resourceId]) {
      copy.meta.targetName = serverMap[copy.resourceId];
    }
    return copy;
  });

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const result = {
    list: enrichedList,
    total,
    page,
    pageSize: limit,
    totalPages,
    hasNext,
    hasPrev
  };

  await setCache(cacheKey, result, 30);
  return result;
}

module.exports = { getLogs };
