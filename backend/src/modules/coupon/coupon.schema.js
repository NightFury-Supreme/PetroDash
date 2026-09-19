/**
 * Coupon Zod Schema
 */

const { z } = require('zod');

const validateCouponSchema = z.object({
  code: z.string().min(1),
  planId: z.string().min(1)
});

module.exports = {
  validateCouponSchema
};
