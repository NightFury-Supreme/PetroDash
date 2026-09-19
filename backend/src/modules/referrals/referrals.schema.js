/**
 * Referrals Validation Schemas
 * ISO/IEC 25010 & OWASP Top 10 (A03:2021-Injection, A04:2021-Insecure Design)
 */

const { z } = require('zod');

const setReferralCodeSchema = z.object({
  code: z.string().trim().min(3).max(20).regex(/^[A-Za-z0-9_-]+$/, "Code must contain only letters, numbers, hyphens, and underscores")
});

const getReferralsListSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(5)
});

module.exports = {
  setReferralCodeSchema,
  getReferralsListSchema
};
