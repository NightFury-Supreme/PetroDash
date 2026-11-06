const { z } = require('zod');

const shopItemIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Invalid shop item ID format'),
});

const updateShopItemSchema = z.object({
  amountPerUnit: z.coerce.number().min(0).max(1000000).optional(),
  pricePerUnit: z.coerce.number().min(0).max(100000).optional(),
  description: z.string().max(500).optional(),
  enabled: z.coerce.boolean().optional(),
  maxPerPurchase: z.coerce.number().int().min(0).max(10000).optional(),
});

module.exports = {
  shopItemIdParamSchema,
  updateShopItemSchema,
};
