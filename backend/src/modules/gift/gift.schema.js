const { z } = require('zod');

const createGiftSchema = z.object({
  coins: z.coerce.number().int().min(1).max(1_000_000, "Coins exceed maximum allowed"),
  maxRedemptions: z.coerce.number().int().min(1).max(100).optional().default(1),
  expiresInDays: z.coerce.number().int().min(1).max(180).optional().default(30),
  description: z.string().max(100, "Description must be under 100 characters").optional()
});

const getMyGiftsSchema = z.object({
  paginate: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  status: z.enum(['active', 'inactive']).optional()
});

const redeemGiftSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Za-z0-9_\-]+$/, "Invalid code format").trim()
});

module.exports = {
  createGiftSchema,
  getMyGiftsSchema,
  redeemGiftSchema
};
