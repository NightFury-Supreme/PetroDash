/**
 * Admin Users Service (Query & Aggregation Hub)
 * Complies with ISO/IEC 25010 (Clean Architecture, Single Responsibility)
 */

const { Types } = require('mongoose');
const User = require('../../../models/User');
const Server = require('../../../models/Server');
const UserPlan = require('../../../models/UserPlan');
const AuditLog = require('../../../models/AuditLog');
const AppError = require('../../../utils/AppError');
const { getServer: getPanelServer } = require('../../../services/pterodactyl');
const { getCache, setCache } = require('../../../lib/redis');

const mutationService = require('./users.admin.mutation.service');
const serversService = require('./users.admin.servers.service');
const plansService = require('./users.admin.plans.service');

const listUsers = async ({ search, page = '1', limit = '10', pageSize, role, status, sortBy }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(pageSize || limit, 10) || 10));

  const cacheKey = `admin:users:${search || ''}:${role || 'all'}:${status || 'all'}:${sortBy || 'newest'}:${pageNum}:${limitNum}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  let filter = {};
  if (typeof search === 'string' && search.trim()) {
    const s = search.trim();
    const or = [{ email: { $regex: s, $options: 'i' } }, { username: { $regex: s, $options: 'i' } }];
    try {
      if (Types.ObjectId.isValid(s)) {
        or.push({ _id: s });
      }
    } catch {}
    filter = { $or: or };
  }

  if (role && role !== 'all') {
    filter.role = role;
  }

  if (status && status !== 'all') {
    if (status === 'banned') {
      filter['ban.isBanned'] = true;
    } else if (status === 'active') {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { 'ban.isBanned': false },
          { 'ban.isBanned': { $exists: false } },
          { 'ban': { $exists: false } }
        ]
      });
    }
  }

  let sort = { createdAt: -1 };
  if (sortBy === 'oldest') sort = { createdAt: 1 };
  else if (sortBy === 'username_asc') sort = { username: 1 };
  else if (sortBy === 'username_desc') sort = { username: -1 };
  else if (sortBy === 'coins_desc') sort = { coins: -1 };
  else if (sortBy === 'coins_asc') sort = { coins: 1 };

  const total = await User.countDocuments(filter);
  const users = await User.find(filter, { passwordHash: 0 })
    .sort(sort)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const userIds = users.map((u) => u._id);
  const servers = await Server.aggregate([
    { $match: { owner: { $in: userIds } } },
    { $group: { _id: '$owner', count: { $sum: 1 } } },
  ]);
  const idToCount = Object.fromEntries(servers.map((s) => [String(s._id), s.count]));
  const list = users.map((u) => ({ ...u, serverCount: idToCount[String(u._id)] || 0 }));

  const result = {
    data: list,
    meta: {
      total,
      currentPage: pageNum,
      pageSize: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };

  await setCache(cacheKey, result, 30);
  return result;
};

const getUser = async (id, query = {}) => {
  if (!Types.ObjectId.isValid(String(id))) {
    throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  }

  const referralPage = parseInt(query.referralPage, 10) || 1;
  const referralPageSize = parseInt(query.referralPageSize, 10) || 5;

  const cacheKey = `admin:users:detail:${id}:${referralPage}:${referralPageSize}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const user = await User.findById(String(id), { passwordHash: 0 })
    .populate('referredBy', 'username email referralCode')
    .lean();
  if (!user) {
    throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  }

  const serversRaw = await Server.find({ owner: user._id })
    .populate('eggId', 'name icon')
    .populate('locationId', 'name flag')
    .lean();

  let base = process.env.PTERO_BASE_URL || process.env.PTERODACTYL_URL || '';
  if (base.endsWith('/')) base = base.slice(0, -1);

  const servers = await Promise.all(
    serversRaw.map(async (s) => {
      let clientUrl = base;
      if (s.panelServerId) {
        try {
          const panel = await getPanelServer(s.panelServerId);
          const identifier =
            panel?.attributes?.identifier || panel?.attributes?.uuid || panel?.identifier || panel?.uuid || null;
          if (identifier) clientUrl = `${base}/server/${identifier}`;
        } catch (_) {}
      }
      return { ...s, clientUrl };
    })
  );

  const usage = servers.reduce(
    (acc, s) => {
      const l = s.limits || {};
      acc.diskMb += Number(l.diskMb) || 0;
      acc.memoryMb += Number(l.memoryMb) || 0;
      acc.cpuPercent += Number(l.cpuPercent) || 0;
      acc.backups += Number(l.backups) || 0;
      acc.databases += Number(l.databases) || 0;
      acc.allocations += Number(l.allocations) || 0;
      return acc;
    },
    { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 }
  );

  const plans = await UserPlan.find({ userId: user._id, status: 'active' })
    .populate('planId', 'name pricePerMonth pricePerYear icon features')
    .lean();

  const totalReferred = await User.countDocuments({ referredBy: user._id });
  const referredUsers = await User.find({ referredBy: user._id }, { passwordHash: 0 })
    .skip((referralPage - 1) * referralPageSize)
    .limit(referralPageSize)
    .lean();

  const referralStats = user.referralStats || { referredCount: 0, coinsEarned: 0 };

  const loginMethod = user.passwordHash
    ? 'email'
    : user.discordId
    ? 'discord'
    : user.googleId
    ? 'google'
    : user.githubId
    ? 'github'
    : 'unknown';

  const result = {
    user: {
      ...user,
      loginMethod,
      referralStats: {
        ...referralStats,
        referredCount: totalReferred,
      },
    },
    servers,
    usage,
    plans,
    referrals: {
      items: referredUsers,
      total: totalReferred,
      page: referralPage,
      pageSize: referralPageSize,
      totalPages: Math.ceil(totalReferred / referralPageSize),
    },
  };

  await setCache(cacheKey, result, 30);
  return result;
};

const getUserActivity = async (id, { page = 1, limit = 10 } = {}) => {
  if (!Types.ObjectId.isValid(String(id))) {
    throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(Math.max(1, parseInt(limit, 10) || 10), 100);

  const cacheKey = `admin:users:activity:${id}:${p}:${l}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const userExists = await User.exists({ _id: String(id) });
  if (!userExists) {
    throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  }

  const skip = (p - 1) * l;
  const userObjectId = Types.ObjectId.isValid(String(id)) ? new Types.ObjectId(String(id)) : null;
  const filter = {
    $or: [
      { actorId: userObjectId },
      { targetUserId: userObjectId },
      { resourceType: 'user', resourceId: String(id) },
      { 'meta.targetUserId': String(id) },
      { 'meta.userId': String(id) },
      { 'meta.owner': String(id) },
      { 'meta.ownerId': String(id) },
    ],
  };

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  const missingAdminIds = new Set();
  logs.forEach((log) => {
    const meta = log.meta || log.metadata || {};
    const adminIdCandidate = log.actorId || meta.adminId;
    if (adminIdCandidate && /^[0-9a-fA-F]{24}$/.test(String(adminIdCandidate))) {
      missingAdminIds.add(String(adminIdCandidate));
    }
  });

  let adminUserMap = {};
  if (missingAdminIds.size > 0) {
    const adminUsers = await User.find({ _id: { $in: [...missingAdminIds] } }, 'username role').lean();
    adminUserMap = Object.fromEntries(adminUsers.map((u) => [u._id.toString(), u]));
  }

  const result = {
    data: logs.map((log) => {
      const meta = { ...(log.meta || log.metadata || {}) };
      const actorIdStr = log.actorId ? log.actorId.toString() : (meta.adminId ? String(meta.adminId) : null);
      if (actorIdStr && adminUserMap[actorIdStr]) {
        meta.adminUsername = meta.adminUsername || adminUserMap[actorIdStr].username;
        meta.adminRole = meta.adminRole || adminUserMap[actorIdStr].role;
      }

      let resolvedIp = (log.ip && log.ip !== 'unknown' && log.ip !== '::1') ? log.ip : (meta.ip || log.ip);
      if (typeof resolvedIp === 'string') {
        resolvedIp = resolvedIp.trim();
        if (resolvedIp.startsWith('::ffff:')) resolvedIp = resolvedIp.replace('::ffff:', '');
        if (resolvedIp === '::1') resolvedIp = '127.0.0.1';
      }
      const resolvedUa = (log.userAgent && log.userAgent !== 'unknown') ? log.userAgent : (meta.userAgent || log.userAgent);

      return {
        _id: log._id.toString(),
        action: log.action,
        category: log.category,
        severity: log.severity,
        actorId: actorIdStr,
        actorRole: log.actorRole || meta.adminRole,
        actorUsername: log.actorUsername || meta.adminUsername,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        targetUserId: log.targetUserId ? log.targetUserId.toString() : null,
        method: log.method,
        path: log.path,
        statusCode: log.statusCode,
        sessionId: log.sessionId,
        ip: resolvedIp,
        userAgent: resolvedUa,
        createdAt: log.createdAt,
        metadata: meta,
        meta: meta,
        success: log.success !== undefined ? log.success : (!log.action.includes('failed') && !log.action.includes('error')),
      };
    }),
    pagination: {
      total,
      page: p,
      limit: l,
      pages: Math.ceil(total / l) || 1,
    },
  };

  await setCache(cacheKey, result, 15);
  return result;
};

module.exports = {
  listUsers,
  getUser,
  getUserActivity,
  updateUser: mutationService.updateUser,
  banUser: mutationService.banUser,
  deleteUser: mutationService.deleteUser,
  deleteServer: serversService.deleteServer,
  getServer: serversService.getServer,
  updateServer: serversService.updateServer,
  addPlan: plansService.addPlan,
  cancelPlans: plansService.cancelPlans,
  cancelPlanInstance: plansService.cancelPlanInstance,
};
