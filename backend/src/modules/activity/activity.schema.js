const { z } = require('zod');

const activityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

module.exports = {
  activityQuerySchema,
};
