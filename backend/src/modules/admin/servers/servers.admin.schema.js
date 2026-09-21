/* ==========================================================================
   Admin Servers Validation Schemas
   Compliance: ISO/IEC 25010, OWASP Input Validation
========================================================================== */

const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const serverIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'ERR_INVALID_ID'),
});

const serverListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  paginate: z.string().optional(),
  search: z.string().optional(),
  locationId: z.string().optional(),
  eggId: z.string().optional(),
  status: z.string().optional(),
  sort: z.enum([
    'created_desc',
    'created_asc',
    'name_asc',
    'name_desc',
    'cpu_desc',
    'memory_desc',
    'disk_desc'
  ]).optional(),
  refresh: z.enum(['true', 'false']).optional(),
});

const serverQueueQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  paginate: z.string().optional(),
  search: z.string().optional(),
  locationId: z.string().optional(),
  eggId: z.string().optional(),
  sort: z.string().optional(),
});

const clearQueueQuerySchema = z.object({
  locationId: z.string().optional(),
  eggId: z.string().optional(),
});

const updateServerSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  limits: z.object({
    diskMb: z.coerce.number().int().min(0),
    memoryMb: z.coerce.number().int().min(0),
    cpuPercent: z.coerce.number().int().min(0),
    backups: z.coerce.number().int().min(0),
    databases: z.coerce.number().int().min(0),
    allocations: z.coerce.number().int().min(0),
  }),
});

const deleteServerQuerySchema = z.object({
  force: z.coerce.boolean().optional(),
});

module.exports = {
  serverIdParamSchema,
  serverListQuerySchema,
  serverQueueQuerySchema,
  clearQueueQuerySchema,
  updateServerSchema,
  deleteServerQuerySchema,
};
