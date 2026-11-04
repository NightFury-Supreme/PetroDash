const { z } = require('zod');

const statsQuerySchema = z.object({
  range: z.enum(['7D', '14D', '30D']).optional().default('7D'),
  refresh: z.enum(['true', 'false']).optional(),
});

module.exports = { statsQuerySchema };
