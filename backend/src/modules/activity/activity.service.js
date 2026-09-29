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
          (typeof log.action === 'string' && log.action.startsWith('admin.')) ||
          log.metadata?.performedByAdmin ||
          log.metadata?.updatedByAdmin ||
          log.metadata?.adminId ||
          log.metadata?.adminUsername
        );

        return {
          _id: log._id.toString(),
          action: log.action,
          // Hide admin browser and IP on the user-facing profile page
          ip: isPerformedByAdmin ? null : log.ip,
          userAgent: isPerformedByAdmin ? null : log.userAgent,
          createdAt: log.createdAt,
          metadata: log.metadata,
          success: !log.action.includes('failed') && !log.action.includes('error'),
        };
      }),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }
}

module.exports = new ActivityService();
