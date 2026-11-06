const { z } = require('zod');

const setReferralCodeSchema = z.object({
  code: z.string().trim().min(3).max(20).regex(/^[A-Za-z0-9_-]+$/, "Code must contain only letters, numbers, hyphens, and underscores")
}).strict();

const getReferralsListSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(5)
}).strict();

module.exports = {
  setReferralCodeSchema,
  getReferralsListSchema
};
