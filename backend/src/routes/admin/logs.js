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
  resourceType: z.string().optional(),
  requestId: z.string().optional(),
  severity: z.string().optional(),
  sortBy: z.enum(['newest', 'oldest']).optional()
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

    const { page, pageSize, action, actorId, resourceType, requestId, severity } = parsed.data;

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

    if (requestId && typeof requestId === 'string') {
      query.requestId = requestId;
    }

    if (severity && typeof severity === 'string') {
      query.severity = severity;
    }

    // Calculate pagination
    const limit = pageSize;
    const skip = (page - 1) * limit;

    const { getCache, setCache } = require('../../lib/redis');
    const sortByParam = parsed.data.sortBy || 'newest';
    const cacheKey = `admin:logs:${page}:${pageSize}:${action || ''}:${actorId || ''}:${resourceType || ''}:${requestId || ''}:${severity || ''}:${sortByParam}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    // Determine sort object
    const sortObj = sortByParam === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    // Execute queries with proper error handling
    const [list, total] = await Promise.all([
      AuditLog.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      AuditLog.countDocuments(query).exec()
    ]);

    // --- ENRICH TARGET NAMES ---
    const User = require('../../models/User');
    const Server = require('../../models/Server');

    const userIds = [...new Set(list.filter(l => l.resourceType === 'user' && l.resourceId).map(l => l.resourceId))];
    const serverIds = [...new Set(list.filter(l => l.resourceType === 'server' && l.resourceId).map(l => l.resourceId))];

    const [users, servers] = await Promise.all([
      userIds.length ? User.find({ _id: { $in: userIds } }, 'username role').lean() : [],
      serverIds.length ? Server.find({ _id: { $in: serverIds } }, 'name').lean() : []
    ]);

    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), { name: u.username, role: u.role }]));
    const serverMap = Object.fromEntries(servers.map(s => [s._id.toString(), s.name]));

    const enrichedList = list.map(log => {
      const copy = { ...log };
      if (!copy.meta) copy.meta = {};
      if (copy.resourceType === 'user' && copy.resourceId && userMap[copy.resourceId]) {
        copy.meta.targetName = userMap[copy.resourceId].name;
        if (userMap[copy.resourceId].role) {
          copy.meta.targetRole = userMap[copy.resourceId].role;
        }
      }
      if (copy.resourceType === 'server' && copy.resourceId && serverMap[copy.resourceId]) {
        copy.meta.targetName = serverMap[copy.resourceId];
      }
      return copy;
    });
    // ---------------------------

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const result = {
      list: enrichedList,
      total,
      page,
      pageSize: limit,
      totalPages,
      hasNext,
      hasPrev
    };

    await setCache(cacheKey, result, 30);
    return res.json(result);

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


