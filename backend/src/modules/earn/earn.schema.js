const { z } = require('zod');
const { isValidEntityId } = require('../../utils/publicId');

const METHOD_KEYS = ['linkvertise'];

const earnMethodSchema = z.enum(['linkvertise']);

const startEarnSchema = z.object({
  targetUrl: z.string().url().max(2048).optional(),
});

const claimEarnSchema = z.object({
  sessionId: z.string().refine((val) => isValidEntityId(val, 'earnSession'), { message: 'ERR_INVALID_SESSION_ID' }),
  hash: z.string().max(2048).optional(),
  secret: z.string().max(128).optional(),
});

module.exports = {
  METHOD_KEYS,
  earnMethodSchema,
  startEarnSchema,
  claimEarnSchema
};
