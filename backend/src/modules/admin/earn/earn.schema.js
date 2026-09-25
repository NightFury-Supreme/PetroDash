/**
 * Admin Earn Schemas
 * Complies with ISO/IEC 25010 and OWASP ASVS V5 (Input Validation)
 */

const { z } = require('zod');

const earnPatchSchema = z.object({
  linkvertise: z.object({
    enabled: z.coerce.boolean().optional(),
    coins: z.coerce.number().int().min(0).max(1000000).optional(),
    cooldownSeconds: z.coerce.number().int().min(0).max(86400).optional(),
    waitSeconds: z.coerce.number().int().min(0).max(3600).optional(),
    maxClaimsPerDay: z.coerce.number().int().min(0).max(1000).optional(),
    url: z.string().max(2048).optional().or(z.literal('')),
    antiBypassToken: z.string().max(2048).optional().or(z.literal('')),
  }).optional(),
});

const getSessionsQuerySchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  method: z.enum(['linkvertise']).optional(),
  status: z.enum(['started', 'completed', 'expired']).optional(),
});

module.exports = {
  earnPatchSchema,
  getSessionsQuerySchema,
};
