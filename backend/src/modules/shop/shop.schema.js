/**
 * Shop Validation Schemas
 * ISO/IEC 25010 & OWASP Top 10 (A03:2021-Injection, A04:2021-Insecure Design)
 */

const { z } = require('zod');

const purchaseSchema = z.object({
  itemKey: z
    .string({
      required_error: 'itemKey is required',
      invalid_type_error: 'itemKey must be a string',
    })
    .min(1, 'itemKey cannot be empty')
    .max(50, 'itemKey is too long')
    .trim(),
  quantity: z.coerce
    .number({
      required_error: 'quantity is required',
      invalid_type_error: 'quantity must be a number',
    })
    .int('quantity must be an integer')
    .min(1, 'quantity must be at least 1')
    .max(100, 'quantity cannot exceed 100'),
});

module.exports = {
  purchaseSchema,
};
