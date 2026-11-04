/**
 * Plan Validation Schema
 */

const { z } = require('zod');

const getPlansSchema = z.object({
  paginate: z.enum(['true', 'false', '']).optional().default('false'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(12)
});

module.exports = {
  getPlansSchema
};
