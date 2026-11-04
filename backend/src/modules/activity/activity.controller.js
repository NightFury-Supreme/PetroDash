const activityService = require('./activity.service');
const { activityQuerySchema } = require('./activity.schema');
const AppError = require('../../utils/AppError');

class ActivityController {
  async getUserActivity(req, res, next) {
    try {
      const parsed = activityQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw AppError.badRequest(
          'ERR_ACTIVITY_QUERY_INVALID',
          'ERR_ACTIVITY_QUERY_INVALID',
          parsed.error.flatten()
        );
      }

      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
      });

      const { page, limit } = parsed.data;
      const userIdentifier = req.user.publicId;
      const result = await activityService.getUserActivityLogs(userIdentifier, page, limit);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(
        error instanceof AppError
          ? error
          : AppError.internal('ERR_ACTIVITY_FETCH_FAILED', 'ERR_ACTIVITY_FETCH_FAILED')
      );
    }
  }
}

module.exports = new ActivityController();

