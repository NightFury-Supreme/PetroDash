/* ==========================================================================
   Admin Eggs Validation Schemas
   Compliance: ISO/IEC 25010, OWASP Input Validation, Schema Locality
========================================================================== */

const { z } = require('zod');

const envVarSchema = z.object({
  key: z.string().trim().min(1, 'Environment variable key is required'),
  value: z.string().default(''),
});

const createEggSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters'),
  category: z.string().trim().min(1, 'Category is required'),
  icon: z.string().trim().min(1, 'Icon path is required'),
  pterodactylEggId: z.coerce.number().int().nonnegative('Egg ID must be a non-negative integer'),
  pterodactylNestId: z.coerce.number().int().nonnegative('Nest ID must be a non-negative integer'),
  recommended: z.coerce.boolean().optional().default(false),
  description: z.string().trim().min(1, 'Description is required').max(150, 'Description cannot exceed 150 characters'),
  env: z.array(envVarSchema).optional().default([]),
  allowedPlans: z.array(z.string()).optional().default([]),
});

const updateEggSchema = createEggSchema.partial();

const eggIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Egg ID is required'),
});

const eggCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(50, 'Category name must not exceed 50 characters'),
});

const eggCategoryIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Category ID is required'),
});

module.exports = {
  envVarSchema,
  createEggSchema,
  updateEggSchema,
  eggIdParamSchema,
  eggCategorySchema,
  eggCategoryIdParamSchema,
};
