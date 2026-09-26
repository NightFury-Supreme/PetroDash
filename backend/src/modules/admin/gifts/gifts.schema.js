/* ==========================================================================
   Admin Gifts Validation Schemas
   Compliance: ISO/IEC 25010, OWASP Input Validation
========================================================================== */

const { z } = require('zod');

const rewardResourcesSchema = z.object({
  diskMb: z.number().int().min(0).max(1_000_000_000).default(0),
  memoryMb: z.number().int().min(0).max(1_000_000_000).default(0),
  cpuPercent: z.number().int().min(0).max(1000).default(0),
  backups: z.number().int().min(0).max(10_000).default(0),
  databases: z.number().int().min(0).max(10_000).default(0),
  allocations: z.number().int().min(0).max(10_000).default(0),
  serverSlots: z.number().int().min(0).max(10_000).default(0),
}).partial();

const rewardSchema = z.object({
  coins: z.number().int().min(0).max(1_000_000).default(0),
  resources: rewardResourcesSchema.optional(),
  planIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid plan ID')).optional(),
}).partial();

const dateStringSchema = z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
  message: 'Invalid date format',
}).nullable().optional();

const createGiftSchema = z.object({
  code: z.string().trim().min(1, 'ERR_GIFT_CODE_REQUIRED').max(50),
  description: z.string().max(100).optional().default(''),
  rewards: rewardSchema.optional(),
  maxRedemptions: z.number().int().min(0).max(1_000_000).default(0),
  validFrom: dateStringSchema,
  validUntil: dateStringSchema,
  enabled: z.boolean().default(true),
});

const updateGiftSchema = z.object({
  code: z.string().trim().min(1).max(50).optional(),
  description: z.string().max(100).optional(),
  rewards: rewardSchema.optional(),
  maxRedemptions: z.number().int().min(0).max(1_000_000).optional(),
  validFrom: dateStringSchema,
  validUntil: dateStringSchema,
  enabled: z.boolean().optional(),
});

const listGiftsQuerySchema = z.object({
  search: z.string().optional().default(''),
  tab: z.enum(['all', 'active', 'inactive']).optional().default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(['newest', 'oldest', 'created_desc', 'created_asc', 'coins_desc', 'coins_asc', 'uses_desc', 'uses_asc', 'status_active', 'status_expired']).optional().default('newest'),
});

const giftRedemptionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

module.exports = {
  createGiftSchema,
  updateGiftSchema,
  listGiftsQuerySchema,
  giftRedemptionsQuerySchema,
};
