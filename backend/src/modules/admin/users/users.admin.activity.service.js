const User = require('../../../models/User');
const AuditLog = require('../../../models/AuditLog');
const AppError = require('../../../utils/AppError');
const { getOrSetCache } = require('../../../lib/redis');
const { isValidEntityId } = require('../../../utils/publicId');

const getUserActivity = async (id, { page = 1, limit = 10 } = {}) => {
  if (!isValidEntityId(String(id), 'user')) {
    throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(Math.max(1, parseInt(limit, 10) || 10), 100);

  const userDoc = await User.findOne({ publicId: id }).select('publicId username role').lean();
  if (!userDoc) {
    throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  }

  const pubUserId = userDoc.publicId;
  const cacheKey = `admin:users:activity:${pubUserId}:${p}:${l}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      const skip = (p - 1) * l;
      const filter = {
        $or: [
          { actorId: pubUserId },
          { targetUserId: pubUserId },
        ],
      };

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .select('publicId actorId actorRole actorUsername action severity category requestId sessionId resourceType resourceId targetUserId meta ip userAgent location method path statusCode success createdAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(l)
          .lean(),
        AuditLog.countDocuments(filter),
      ]);

      const userIds = new Set();
      logs.forEach((log) => {
        const rawMeta = log.meta || log.metadata || {};
        if (log.actorId) userIds.add(String(log.actorId));
        if (rawMeta.adminId) userIds.add(String(rawMeta.adminId));
        if (log.targetUserId) userIds.add(String(log.targetUserId));
      });

      const userMap = { [pubUserId]: { publicId: pubUserId, username: userDoc.username, role: userDoc.role } };
      if (userIds.size > 0) {
        const foundUsers = await User.find({ publicId: { $in: [...userIds] } })
          .select('username role publicId')
          .lean();
        foundUsers.forEach((u) => {
          if (u.publicId) {
            userMap[u.publicId] = u;
          }
        });
      }

      return {
        data: logs.map((log) => {
          const rawMeta = log.meta || log.metadata || {};
          const meta = { ...rawMeta };
          const actorIdStr = log.actorId ? String(log.actorId) : (rawMeta.adminId ? String(rawMeta.adminId) : null);
          if (actorIdStr && userMap[actorIdStr]) {
            meta.adminUsername = meta.adminUsername || userMap[actorIdStr].username;
            meta.adminRole = meta.adminRole || userMap[actorIdStr].role;
          }

          let resolvedIp = (log.ip && log.ip !== 'unknown' && log.ip !== '::1') ? log.ip : (meta.ip || log.ip);
          if (typeof resolvedIp === 'string') {
            resolvedIp = resolvedIp.trim();
            if (resolvedIp.startsWith('::ffff:')) resolvedIp = resolvedIp.replace('::ffff:', '');
            if (resolvedIp === '::1') resolvedIp = '127.0.0.1';
          }
          const resolvedUa = (log.userAgent && log.userAgent !== 'unknown') ? log.userAgent : (meta.userAgent || log.userAgent);

          const isStaff = Boolean(
            log.actorId !== pubUserId &&
            (log.actorRole === 'admin' || log.action.startsWith('admin.') || log.meta?.suspendedByAdmin || log.meta?.performedByStaff)
          );

          const isSystem = Boolean(
            !isStaff && (
              log.actorId === 'system' ||
              log.action.startsWith('server.compliance.') ||
              log.action.startsWith('server.auto_') ||
              log.action.startsWith('system.') ||
              (log.actorRole === 'system' && !log.action.startsWith('auth.'))
            )
          );

          const isSelf = !isStaff && !isSystem;
          const actorType = isSelf ? 'self' : isStaff ? 'staff' : 'system';

          return {
            id: log.publicId,
            action: log.action,
            category: log.category,
            severity: log.severity,
            actorType,
            actorId: actorIdStr,
            actorRole: log.actorRole || meta.adminRole,
            actorUsername: log.actorUsername || meta.adminUsername,
            resourceType: log.resourceType,
            resourceId: log.resourceId || null,
            targetUserId: log.targetUserId || null,
            method: log.method,
            path: log.path,
            statusCode: log.statusCode,
            sessionId: log.sessionId || null,
            ip: resolvedIp,
            userAgent: resolvedUa,
            location: log.location || meta.location || null,
            createdAt: log.createdAt,
            metadata: meta,
            meta,
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
    },
    15
  );
};

module.exports = {
  getUserActivity,
};
