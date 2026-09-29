/**
 * Admin Users Validation Schemas
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

const { z } = require('zod');

const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  role: z.enum(['all', 'user', 'admin']).optional(),
  status: z.enum(['all', 'active', 'banned']).optional(),
  sortBy: z.string().optional(),
  paginate: z.string().optional(),
});

const resourcesSchema = z.object({
  diskMb: z.coerce.number().int().min(0).optional(),
  memoryMb: z.coerce.number().int().min(0).optional(),
  cpuPercent: z.coerce.number().int().min(0).optional(),
  backups: z.coerce.number().int().min(0).optional(),
  databases: z.coerce.number().int().min(0).optional(),
  allocations: z.coerce.number().int().min(0).optional(),
  serverSlots: z.coerce.number().int().min(0).optional(),
}).partial();

const updateUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  coins: z.coerce.number().int().min(0).optional(),
  resources: resourcesSchema.optional(),
  email: z.string().email('ERR_INVALID_EMAIL').optional(),
  username: z.string().min(3, 'ERR_USERNAME_MIN').max(32, 'ERR_USERNAME_MAX').regex(/^[a-zA-Z0-9_.-]+$/, 'ERR_USERNAME_FORMAT').optional(),
  firstName: z.string().max(64, 'ERR_FIRSTNAME_MAX').optional(),
  lastName: z.string().max(64, 'ERR_LASTNAME_MAX').optional(),
  referralCode: z
    .string()
    .trim()
    .min(1, 'ERR_REFERRAL_CODE_EMPTY')
    .min(3, 'ERR_REFERRAL_CODE_MIN')
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, 'ERR_REFERRAL_CODE_FORMAT')
    .optional(),
  ban: z
    .object({
      isBanned: z.boolean(),
      reason: z.string().trim().optional(),
      until: z.union([z.string().datetime().nullable(), z.null()]).optional(),
    })
    .partial()
    .optional(),
  profilePicture: z.string().url('ERR_INVALID_URL').or(z.literal('')).optional(),
});

const banUserSchema = z.object({
  isBanned: z.boolean(),
  reason: z.string().trim().optional(),
  durationMinutes: z.coerce.number().int().min(1).optional().nullable(),
});

const serverUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  limits: z
    .object({
      diskMb: z.coerce.number().int().min(100).optional(),
      memoryMb: z.coerce.number().int().min(128).optional(),
      cpuPercent: z.coerce.number().int().min(10).optional(),
      backups: z.coerce.number().int().min(0).optional(),
      databases: z.coerce.number().int().min(0).optional(),
      allocations: z.coerce.number().int().min(1).optional(),
    })
    .optional(),
});

const addPlanSchema = z.object({
  planId: z.string().min(1),
  months: z.coerce.number().int().min(0),
});

module.exports = {
  listUsersQuerySchema,
  resourcesSchema,
  updateUserSchema,
  banUserSchema,
  serverUpdateSchema,
  addPlanSchema,
};
