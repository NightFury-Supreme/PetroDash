const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const UserActivityLog = require('../models/UserActivityLog');

const AppError = require('../utils/AppError');

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 10), 100);
    const skip = (page - 1) * limit;

    const filter = { 
      userId: req.user.sub
    };

    const logs = await UserActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id action ip userAgent createdAt metadata');

    const total = await UserActivityLog.countDocuments(filter);

    res.json({
      success: true,
      data: logs.map(log => ({
        _id: log._id.toString(),
        action: log.action,
        ip: log.ip,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        metadata: log.metadata,
        success: !log.action.includes('failed') && !log.action.includes('error')
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Failed to fetch activity logs', 500, 'ERR_ACTIVITY_FETCH_FAILED'));
  }
});

module.exports = router;
