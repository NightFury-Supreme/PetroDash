/**
 * Admin Plans Validation Schemas
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

const { z } = require('zod');

const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(50, 'Category name too long'),
});

const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(50, 'Category name too long'),
});

const createPlanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  strikeThroughPrice: z.number().min(0, 'Strike-through price must be 0 or greater').default(0),
  pricePerMonth: z.number().min(0, 'Monthly price must be 0 or greater'),
  pricePerYear: z.number().min(0, 'Yearly price must be 0 or greater').optional().default(0),
  visibility: z.enum(['public', 'unlisted']).default('public'),
  availableAt: z.string().optional(),
  availableUntil: z.string().optional(),
  stock: z.number().default(0),
  limitPerCustomer: z.number().min(0).default(1),
  category: z.string().min(1, 'Category is required'),
  redirectionLink: z.string().optional(),
  billingOptions: z.object({
    renewable: z.boolean().default(true),
    nonRenewable: z.boolean().default(false),
    lifetime: z.boolean().default(false),
  }),
  availableBillingCycles: z
    .array(z.enum(['monthly', 'quarterly', 'semi-annual', 'annual']))
    .default(['monthly']),
  productContent: z.object({
    recurrentResources: z.object({
      cpuPercent: z.number().min(0, 'CPU must be 0 or greater'),
      memoryMb: z.number().min(0, 'Memory must be 0 or greater'),
      diskMb: z.number().min(0, 'Disk must be 0 or greater'),
      swapMb: z.number().default(0),
      blockIoProportion: z.number().default(100),
      cpuPinning: z.string().default(''),
    }),
    additionalAllocations: z.number().min(0).default(0),
    databases: z.number().min(0, 'Databases must be 0 or greater'),
    backups: z.number().min(0, 'Backups must be 0 or greater'),
    coins: z.number().min(0).default(0),
    serverLimit: z.number().min(1, 'Server limit must be 1 or greater'),
  }),
  staffNotes: z.string().default(''),
  popular: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

const updatePlanSchema = createPlanSchema.partial();

const patchPlanSchema = z.object({
  enabled: z.boolean().optional(),
  visibility: z.enum(['public', 'unlisted']).optional(),
  popular: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  createPlanSchema,
  updatePlanSchema,
  patchPlanSchema,
};
