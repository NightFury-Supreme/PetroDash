const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const UserActivityLog = require('../models/UserActivityLog');

router.get('/', requireAuth, async (req, res) => {
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
      .select('action ip userAgent createdAt metadata');

    const total = await UserActivityLog.countDocuments(filter);

    res.json({
      success: true,
      data: logs.map(log => ({
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
    console.error('Activity Log Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity logs' });
  }
});

module.exports = router;
