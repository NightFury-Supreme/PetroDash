/**
 * Admin Logs Validation Schema
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

const { z } = require('zod');

const logsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  action: z.string().optional(),
  actorId: z
    .string()
    .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), { message: 'Invalid actor ID format' })
    .optional(),
  resourceType: z.string().optional(),
  requestId: z.string().optional(),
  severity: z.string().optional(),
  sortBy: z.enum(['newest', 'oldest']).optional().default('newest'),
});

module.exports = {
  logsQuerySchema,
};
