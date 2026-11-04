const { z } = require('zod');
const { isValidEntityId } = require('../../../utils/publicId');

const dateStringSchema = z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
  message: 'Invalid date format',
}).nullable().optional();

const createCouponSchema = z.object({
  code: z.string().trim().min(1, 'ERR_COUPON_CODE_REQUIRED').max(50),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0.01, 'ERR_COUPON_VALUE_INVALID'),
  validFrom: dateStringSchema,
  validUntil: dateStringSchema,
  maxRedemptions: z.number().int().min(0).optional().default(0),
  appliesToPlanIds: z.array(z.string().refine((val) => isValidEntityId(val, 'plan'), { message: 'Invalid plan ID' })).optional().default([]),
  enabled: z.boolean().optional().default(true),
}).refine((data) => {
  if (data.type === 'percentage' && data.value > 100) {
    return false;
  }
  return true;
}, {
  message: 'ERR_COUPON_PERCENTAGE_EXCEEDED',
  path: ['value'],
});

const updateCouponSchema = z.object({
  code: z.string().trim().min(1).max(50).optional(),
  type: z.enum(['percentage', 'fixed']).optional(),
  value: z.number().min(0.01, 'ERR_COUPON_VALUE_INVALID').optional(),
  validFrom: dateStringSchema,
  validUntil: dateStringSchema,
  maxRedemptions: z.number().int().min(0).optional(),
  appliesToPlanIds: z.array(z.string().refine((val) => isValidEntityId(val, 'plan'), { message: 'Invalid plan ID' })).optional(),
  enabled: z.boolean().optional(),
}).refine((data) => {
  if (data.type === 'percentage' && data.value !== undefined && data.value > 100) {
    return false;
  }
  return true;
}, {
  message: 'ERR_COUPON_PERCENTAGE_EXCEEDED',
  path: ['value'],
});

const listCouponsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional().default(''),
  status: z.enum(['all', 'active', 'disabled', 'expired']).optional().default('all'),
  type: z.enum(['all', 'percentage', 'fixed']).optional().default('all'),
  sort: z.enum(['newest', 'oldest', 'value_desc', 'value_asc', 'redemptions_desc']).optional().default('newest'),
});

module.exports = {
  createCouponSchema,
  updateCouponSchema,
  listCouponsQuerySchema,
};
