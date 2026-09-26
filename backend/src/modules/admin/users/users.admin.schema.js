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
  email: z.string().email().optional(),
  username: z.string().min(3).max(32).optional(),
  firstName: z.string().min(1).max(64).optional(),
  lastName: z.string().min(1).max(64).optional(),
  referralCode: z
    .string()
    .trim()
    .min(1, 'Referral code cannot be empty')
    .min(3, 'Referral code must be at least 3 characters')
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, 'Referral code can only contain letters, numbers, hyphens and underscores')
    .optional(),
  ban: z
    .object({
      isBanned: z.boolean(),
      reason: z.string().trim().optional(),
      until: z.union([z.string().datetime().nullable(), z.null()]).optional(),
    })
    .partial()
    .optional(),
  profilePicture: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
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
