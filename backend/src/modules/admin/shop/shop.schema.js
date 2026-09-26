/**
 * Admin Shop Validation Schemas
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

const { z } = require('zod');

const shopItemIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid shop item ID format'),
});

const updateShopItemSchema = z.object({
  amountPerUnit: z.coerce.number().min(0).max(1000000).optional(),
  pricePerUnit: z.coerce.number().min(0).max(100000).optional(),
  description: z.string().max(500).optional(),
  enabled: z.coerce.boolean().optional(),
  maxPerPurchase: z.coerce.number().int().min(1).max(10000).optional(),
});

module.exports = {
  shopItemIdParamSchema,
  updateShopItemSchema,
};
