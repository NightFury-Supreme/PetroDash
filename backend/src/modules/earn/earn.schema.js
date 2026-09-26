/**
 * Earn Module Zod Schemas
 * Standardized input validation for earning coin endpoints.
 */

const { z } = require('zod');

const METHOD_KEYS = ['linkvertise'];

const earnMethodSchema = z.enum(['linkvertise']);

const startEarnSchema = z.object({
  targetUrl: z.string().url().max(2048).optional(),
});

const claimEarnSchema = z.object({
  sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ERR_INVALID_SESSION_ID'),
  hash: z.string().max(2048).optional(),
  secret: z.string().max(128).optional(),
});

module.exports = {
  METHOD_KEYS,
  earnMethodSchema,
  startEarnSchema,
  claimEarnSchema
};
