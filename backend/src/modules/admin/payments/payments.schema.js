const { z } = require('zod');
const { isValidEntityId } = require('../../../utils/publicId');

const paymentIdParamSchema = z.object({
  id: z.string().refine((val) => isValidEntityId(val, 'payment'), { message: 'Invalid payment ID format' }),
});

const ledgerQuerySchema = z.object({
  status: z.string().optional(),
  provider: z.string().optional(),
  userId: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const updatePaymentSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'VOIDED']).optional(),
  amount: z.coerce.number().min(0).optional(),
  currency: z.string().min(3).max(3).optional(),
});

module.exports = {
  paymentIdParamSchema,
  ledgerQuerySchema,
  updatePaymentSchema,
};
