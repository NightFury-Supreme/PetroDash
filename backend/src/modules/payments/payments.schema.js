const { z } = require('zod');

const querySchema = z.object({
  paginate: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

const getInvoiceSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment ID format'),
});

module.exports = {
  querySchema,
  getInvoiceSchema
};
