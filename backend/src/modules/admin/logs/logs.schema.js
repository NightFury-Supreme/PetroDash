/**
 * Admin Logs Validation Schema
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

const { z } = require('zod');

const logsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().trim().max(100).optional(),
  action: z.string().trim().optional(),
  actorId: z.string().trim().optional(),
  resourceType: z.string().trim().optional(),
  requestId: z.string().trim().optional(),
  severity: z.string().trim().optional(),
  sortBy: z
    .enum(['newest', 'oldest', 'date_desc', 'date_asc', 'action_asc', 'action_desc', 'type_asc'])
    .optional()
    .default('date_desc'),
});

module.exports = {
  logsQuerySchema,
};
