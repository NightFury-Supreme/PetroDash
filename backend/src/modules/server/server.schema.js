/**
 * Server Zod Validation Schemas
 * OWASP A03:2021-Injection Prevention
 */

const { z } = require('zod');

const getServersListSchema = z.object({
  paginate: z.enum(['true', 'false', '']).optional().default('false'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10)
});

module.exports = {
  getServersListSchema
};
