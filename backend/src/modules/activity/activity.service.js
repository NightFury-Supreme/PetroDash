/*
  Activity Service
  Retrieves paginated user activity logs from the unified AuditLog system.
*/

const mongoose = require('mongoose');
const AuditLog = require('../../models/AuditLog');

class ActivityService {
  async getUserActivityLogs(userId, page, limit) {
    const skip = (page - 1) * limit;
    const userObjectId = mongoose.Types.ObjectId.isValid(String(userId))
      ? new mongoose.Types.ObjectId(String(userId))
      : null;

    const filter = {
      $or: [
        { actorId: userObjectId },
        { targetUserId: userObjectId },
        { resourceType: 'user', resourceId: String(userId) },
        { 'meta.targetUserId': String(userId) },
        { 'meta.userId': String(userId) },
        { 'meta.owner': String(userId) },
        { 'meta.ownerId': String(userId) },
      ],
      action: {
        $nin: [
          'auth.oauth.discord.initiated',
          'auth.oauth.google.initiated',
          'auth.password.reset.requested',
          'auth.2fa.setup_initiated',
        ],
      },
    };

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    return {
      data: logs.map((log) => {
        const isPerformedByAdmin = Boolean(
          log.actorRole === 'admin' ||
          (log.actorId && String(log.actorId) !== String(userId) && typeof log.action === 'string' && (log.action.startsWith('admin.') || log.action.includes('.admin.'))) ||
          log.meta?.performedByAdmin ||
          log.meta?.updatedByAdmin ||
          log.meta?.clearedByAdmin ||
          log.meta?.deletedByAdmin ||
          log.meta?.adminId ||
          log.meta?.adminUsername ||
          log.meta?.adminRole ||
          log.meta?.adminSessionId
        );

        const {
          adminSessionId: _adminSessionId,
          adminIp: _adminIp,
          adminUserAgent: _adminUserAgent,
          ...restMeta
        } = log.meta || log.metadata || {};

        if (isPerformedByAdmin) {
          delete restMeta.sessionId;
        }
        const meta = restMeta;

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
          category: log.category,
          severity: log.severity,
          method: log.method,
          path: log.path,
          statusCode: log.statusCode,
          sessionId: isPerformedByAdmin ? null : (log.sessionId || meta.sessionId),
          ip: resolvedIp,
          userAgent: resolvedUa,
          createdAt: log.createdAt,
          metadata: meta,
          meta: meta,
          success: log.success !== undefined ? log.success : (!log.action.includes('failed') && !log.action.includes('error')),
        };
      }),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }
}

module.exports = new ActivityService();
