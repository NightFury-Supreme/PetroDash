const AuditLog = require('../../models/AuditLog');
const User = require('../../models/User');
const { getOrSetCache } = require('../../lib/redis');

const CACHE_TTL_SECONDS = 30;
const EXCLUDED_USER_ACTIONS = [
  'auth.oauth.discord.initiated',
  'auth.oauth.google.initiated',
  'auth.oauth.discord.2fa_required',
  'auth.oauth.google.2fa_required',
  'auth.password.reset.requested',
  'auth.2fa.setup_initiated',
];
const USER_ACTIVITY_CATEGORIES = ['user_activity', 'billing_event', 'system_event'];

class ActivityService {
  async getUserActivityLogs(userId, page, limit) {
    const user = await User.findOne({ publicId: userId }).select('publicId username role').lean();
    if (!user) return { data: [], pagination: { total: 0, page, limit, pages: 1 } };

    const pubId = user.publicId;
    const cacheKey = `user:activity:${pubId}:${page}:${limit}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;

        const filter = {
          category: { $in: USER_ACTIVITY_CATEGORIES },
          action: { $nin: EXCLUDED_USER_ACTIONS },
          $or: [
            { actorId: pubId },
            { targetUserId: pubId },
          ],
        };

        const [logs, total] = await Promise.all([
          AuditLog.find(filter)
            .select('publicId actorId actorRole actorUsername action severity category requestId sessionId resourceType resourceId targetUserId meta ip userAgent location method path statusCode success createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          AuditLog.countDocuments(filter),
        ]);

        const staffActorIds = new Set();
        logs.forEach((l) => {
          if (l.actorId && l.actorId !== 'system' && l.actorId !== pubId) {
            staffActorIds.add(String(l.actorId));
          }
          if (l.meta?.adminId && l.meta.adminId !== pubId) {
            staffActorIds.add(String(l.meta.adminId));
          }
        });

        const staffMap = {};
        if (staffActorIds.size > 0) {
          const staffUsers = await User.find({ publicId: { $in: [...staffActorIds] } }).select('publicId username role').lean();
          staffUsers.forEach((u) => {
            if (u.publicId) staffMap[u.publicId] = u;
          });
        }

        return {
          data: logs.map((log) => {
            const isModerationAction = Boolean(
              log.action.startsWith('admin.') ||
              log.action === 'server.suspend' ||
              log.action === 'server.unsuspend' ||
              log.meta?.performedByStaff === true ||
              log.meta?.suspendedByAdmin === true
            );

            const isStaff = Boolean(
              isModerationAction ||
              (log.actorRole === 'admin' && (log.actorId !== pubId || !log.action.startsWith('auth.')))
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

            const staffUser =
              (log.actorId && staffMap[log.actorId]) ||
              (log.meta?.adminId && staffMap[log.meta.adminId]) ||
              (log.actorId === pubId ? user : null);
            const staffUsername = log.actorUsername || staffUser?.username || log.meta?.adminUsername || null;
            const staffRole = log.actorRole || staffUser?.role || (isStaff ? 'admin' : null);

            const actorUsername = isStaff ? staffUsername : (isSelf ? user.username : null);
            const actorRole = isStaff ? staffRole : (isSelf ? user.role : null);

            let ip = null;
            let userAgent = null;
            let sessionId = null;
            let location = null;

            if (isSelf) {
              const rawIp = log.ip || log.meta?.ip;
              if (rawIp && rawIp !== 'unknown') {
                let cleaned = String(rawIp).trim();
                if (cleaned.startsWith('::ffff:')) cleaned = cleaned.replace('::ffff:', '');
                if (cleaned === '::1') cleaned = '127.0.0.1';
                ip = cleaned;
              }
              const rawUa = log.userAgent || log.meta?.userAgent;
              userAgent = (rawUa && rawUa !== 'unknown') ? rawUa : null;
              sessionId = log.sessionId || log.meta?.sessionId || null;
              const rawLoc = log.location || log.meta?.location;
              location = (rawLoc && rawLoc !== 'Unknown Location') ? rawLoc : null;
            }

            const safeMeta = { ...(log.meta || {}) };
            delete safeMeta.ip;
            delete safeMeta.sessionId;
            delete safeMeta.userAgent;
            delete safeMeta.location;
            delete safeMeta.adminIp;
            delete safeMeta.adminSessionId;
            delete safeMeta.adminUserAgent;
            delete safeMeta.adminId;
            delete safeMeta.adminRole;
            delete safeMeta.adminUsername;
            delete safeMeta.performedByStaff;
            delete safeMeta.suspendedByAdmin;
            delete safeMeta.category;

            return {
              id: log.publicId,
              action: log.action,
              category: log.category,
              severity: log.severity,
              method: log.method,
              path: log.path,
              statusCode: log.statusCode,
              actorType,
              actorUsername,
              actorRole,
              sessionId,
              ip,
              userAgent,
              location,
              createdAt: log.createdAt,
              metadata: safeMeta,
              meta: safeMeta,
              success:
                log.success !== undefined
                  ? log.success
                  : !log.action.includes('failed') && !log.action.includes('error'),
            };
          }),
          pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
        };
      },
      CACHE_TTL_SECONDS
    );
  }
}

module.exports = new ActivityService();
