const { z } = require('zod');
const { getLogs } = require('./logs.service');
const AppError = require('../../../../utils/AppError');

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

async function getLogsHandler(req, res, next) {
  try {
    const parsed = logsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('Invalid query parameters', 400, parsed.error.flatten());
    }

    if (parsed.data.actorId && typeof parsed.data.actorId === 'string') {
      if (!/^[0-9a-fA-F]{24}$/.test(parsed.data.actorId)) {
        throw new AppError('Invalid actor ID format', 400);
      }
    }

    const data = await getLogs(parsed.data);
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = { getLogsHandler };
