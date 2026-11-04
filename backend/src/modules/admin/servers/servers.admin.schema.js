const { z } = require('zod');
const { isValidEntityId } = require('../../../utils/publicId');

const serverIdParamSchema = z.object({
  id: z.string().refine((val) => isValidEntityId(val, 'server'), { message: 'ERR_INVALID_ID' }),
});

const serverListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  paginate: z.string().optional(),
  search: z.string().trim().max(100).optional(),
  locationId: z.string().trim().max(50).optional(),
  eggId: z.string().trim().max(50).optional(),
  status: z.string().trim().max(50).optional(),
  sort: z.enum([
    'created_desc',
    'created_asc',
    'name_asc',
    'name_desc',
    'cpu_desc',
    'memory_desc',
    'disk_desc'
  ]).optional(),
});

const serverQueueQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  paginate: z.string().optional(),
  search: z.string().trim().max(100).optional(),
  locationId: z.string().trim().max(50).optional(),
  eggId: z.string().trim().max(50).optional(),
  sort: z.enum([
    'created_desc',
    'created_asc',
    'name_asc',
    'name_desc',
    'cpu_desc',
    'memory_desc',
    'disk_desc'
  ]).optional(),
});

const clearQueueQuerySchema = z.object({
  locationId: z.string().trim().max(50).optional(),
  eggId: z.string().trim().max(50).optional(),
});

const updateServerSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  limits: z.object({
    diskMb: z.coerce.number().int().min(0).max(10485760),
    memoryMb: z.coerce.number().int().min(0).max(1048576),
    cpuPercent: z.coerce.number().int().min(0).max(10000),
    backups: z.coerce.number().int().min(0).max(1000),
    databases: z.coerce.number().int().min(0).max(1000),
    allocations: z.coerce.number().int().min(0).max(1000),
  }),
});

const deleteServerQuerySchema = z.object({
  force: z.coerce.boolean().optional(),
});

const suspendServerSchema = z
  .object({
    reason: z.string().trim().max(255).optional().default(''),
    duration: z.enum(['1h', '6h', '12h', '1d', '3d', '7d', '14d', '30d', 'custom', 'lifetime']).optional().default('lifetime'),
    customUntil: z.string().datetime().optional().nullable(),
    durationMinutes: z.coerce.number().int().min(1).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.duration === 'custom') {
        if (!data.customUntil) return false;
        const d = new Date(data.customUntil);
        return !isNaN(d.getTime()) && d.getTime() > Date.now();
      }
      return true;
    },
    { message: 'ERR_INVALID_EXPIRATION', path: ['customUntil'] }
  );

module.exports = {
  serverIdParamSchema,
  serverListQuerySchema,
  serverQueueQuerySchema,
  clearQueueQuerySchema,
  updateServerSchema,
  deleteServerQuerySchema,
  suspendServerSchema,
};
