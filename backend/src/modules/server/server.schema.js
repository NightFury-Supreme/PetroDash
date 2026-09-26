/**
 * Server Zod Validation Schemas
 * Standardized input validation for server endpoints.
 */

const { z } = require('zod');

const getServersListSchema = z.object({
  paginate: z.enum(['true', 'false', '']).optional().default('false'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10)
});

const createServerSchema = z.object({
  name: z.string().trim().min(1).max(50).regex(/^[a-zA-Z0-9\s\-_]+$/, 'ERR_SERVER_NAME_INVALID'),
  eggId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ERR_INVALID_EGG_ID'),
  locationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ERR_INVALID_LOCATION_ID'),
  limits: z.object({
    diskMb: z.coerce.number().int().min(100).max(1000000),
    memoryMb: z.coerce.number().int().min(128).max(1000000),
    cpuPercent: z.coerce.number().int().min(10).max(1000),
    backups: z.coerce.number().int().min(0).max(1000).default(0),
    databases: z.coerce.number().int().min(0).max(1000).default(0),
    allocations: z.coerce.number().int().min(1).max(100),
  }),
});

const updateServerSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  limits: z.object({
    diskMb: z.coerce.number().int().min(100).optional(),
    memoryMb: z.coerce.number().int().min(128).optional(),
    cpuPercent: z.coerce.number().int().min(10).optional(),
    backups: z.coerce.number().int().min(0).optional(),
    databases: z.coerce.number().int().min(0).optional(),
    allocations: z.coerce.number().int().min(1).optional(),
  }).partial().optional()
});

module.exports = {
  getServersListSchema,
  createServerSchema,
  updateServerSchema
};
