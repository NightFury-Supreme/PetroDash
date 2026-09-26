/*
  Activity Controller
  Handles HTTP requests for user activity log retrieval.
*/

const activityService = require('./activity.service');
const AppError = require('../../utils/AppError');

class ActivityController {
  async getUserActivity(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 10), 100);

      const result = await activityService.getUserActivityLogs(req.user.sub, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Failed to fetch activity logs', 500, 'ERR_ACTIVITY_FETCH_FAILED'));
    }
  }
}

module.exports = new ActivityController();
