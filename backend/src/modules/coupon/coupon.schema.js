const { z } = require('zod');

const validateCouponSchema = z.object({
  code: z.string().trim().min(1, 'code is required').max(50, 'code is too long'),
  planId: z.string().trim().min(1, 'planId is required').max(50, 'planId is too long')
});

module.exports = {
  validateCouponSchema
};
