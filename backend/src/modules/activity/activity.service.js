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
      data: logs.map(log => ({
        _id: log._id.toString(),
        action: log.action,
        ip: log.ip,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        metadata: log.metadata,
        success: !log.action.includes('failed') && !log.action.includes('error')
      })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    };
  }
}

module.exports = new ActivityService();
