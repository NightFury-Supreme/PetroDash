/**
 * Admin Locations Schemas
 */

const { z } = require('zod');

const platformSettingsSchema = z
  .object({
    platformLocationId: z.string().trim().optional().default(''),
    swapMb: z.coerce.number().int().default(-1),
    blockIoWeight: z.coerce.number().int().min(10).max(1000).default(500),
    cpuPinning: z.string().trim().optional().default(''),
  })
  .optional()
  .default({});

const createLocationSchema = z.object({
  name: z.string().trim().min(1, 'Location name is required').max(100, 'Name too long'),
  flag: z.string().trim().optional().default(''),
  latencyUrl: z.string().trim().min(1, 'Node IP or hostname is required').max(255),
  serverLimit: z.coerce.number().int().nonnegative().default(0),
  platform: platformSettingsSchema,
  allowedPlans: z.array(z.string().trim()).optional().default([]),
});

const updateLocationSchema = createLocationSchema.partial();

const locationIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid location ID format'),
});

module.exports = {
  createLocationSchema,
  updateLocationSchema,
  locationIdParamSchema,
};
