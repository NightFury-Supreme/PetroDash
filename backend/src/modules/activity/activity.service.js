/*
  Activity Service
  Retrieves paginated user activity logs.
*/

const UserActivityLog = require('../../models/UserActivityLog');

class ActivityService {
  async getUserActivityLogs(userId, page, limit) {
    const skip = (page - 1) * limit;
    const filter = { userId };

    const [logs, total] = await Promise.all([
      UserActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('_id action ip userAgent createdAt metadata'),
      UserActivityLog.countDocuments(filter)
    ]);

    return {
      data: logs.map((log) => {
        const isPerformedByAdmin = Boolean(
          (typeof log.action === 'string' && (log.action.startsWith('admin.') || log.action.includes('.admin.'))) ||
          log.metadata?.performedByAdmin ||
          log.metadata?.updatedByAdmin ||
          log.metadata?.clearedByAdmin ||
          log.metadata?.deletedByAdmin ||
          log.metadata?.adminId ||
          log.metadata?.adminUsername ||
          log.metadata?.adminRole ||
          log.metadata?.adminSessionId
        );

        const meta = { ...(log.metadata || {}) };
        delete meta.adminSessionId;
        delete meta.adminIp;
        delete meta.adminUserAgent;

        if (isPerformedByAdmin) {
          delete meta.sessionId;
        }

        let resolvedIp = isPerformedByAdmin ? null : (log.ip && log.ip !== 'unknown' && log.ip !== '::1' ? log.ip : (meta.ip || log.ip));
        if (typeof resolvedIp === 'string') {
          resolvedIp = resolvedIp.trim();
          if (resolvedIp.startsWith('::ffff:')) resolvedIp = resolvedIp.replace('::ffff:', '');
          if (resolvedIp === '::1') resolvedIp = '127.0.0.1';
        }

        const resolvedUa = isPerformedByAdmin ? null : (log.userAgent && log.userAgent !== 'unknown' ? log.userAgent : (meta.userAgent || log.userAgent));

        return {
          _id: log._id.toString(),
          action: log.action,
          // Hide admin browser and IP on the user-facing profile page
          ip: resolvedIp,
          userAgent: resolvedUa,
          createdAt: log.createdAt,
          metadata: meta,
          success: !log.action.includes('failed') && !log.action.includes('error'),
        };
      }),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }
}

module.exports = new ActivityService();
