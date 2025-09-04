const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const AuditLog = require('../../models/AuditLog');
const { z } = require('zod');
const { createRateLimiter } = require('../../middleware/rateLimit');

const router = express.Router();

// Rate limiting for logs endpoint
const logsRateLimiter = createRateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes
router.use('/', logsRateLimiter);

// Validation schema for query parameters
const logsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  action: z.string().optional(),
  actorId: z.string().optional(),
  resourceType: z.string().optional()
});

// GET /api/admin/logs
router.get('/', requireAdmin, async (req, res) => {
  try {
    // Validate and sanitize query parameters
    const parsed = logsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'Invalid query parameters', 
        details: parsed.error.flatten() 
      });
    }

    const { page, pageSize, action, actorId, resourceType } = parsed.data;

    // Build safe query object
    const query = {};
    
    if (action && typeof action === 'string') {
      // Sanitize action to prevent injection
      query.action = { $regex: action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }
    
    if (actorId && typeof actorId === 'string') {
      // Validate MongoDB ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(actorId)) {
        return res.status(400).json({ error: 'Invalid actor ID format' });
      }
      query.actorId = actorId;
    }
    
    if (resourceType && typeof resourceType === 'string') {
      // Sanitize resourceType to prevent injection
      query.resourceType = { $regex: resourceType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    // Calculate pagination
    const limit = pageSize;
    const skip = (page - 1) * limit;

    // Execute queries with proper error handling
    const [list, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      AuditLog.countDocuments(query).exec()
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return res.json({
      list: list || [],
      total,
      page,
      pageSize: limit,
      totalPages,
      hasNext,
      hasPrev
    });

  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    
    // Don't expose internal error details
    return res.status(500).json({ 
      error: 'Failed to fetch audit logs',
      message: 'An internal server error occurred'
    });
  }
});

module.exports = router;


