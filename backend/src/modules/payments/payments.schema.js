const { z } = require('zod');

const querySchema = z.object({
  paginate: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

const getInvoiceSchema = z.object({
  id: z.string()
});

module.exports = {
  querySchema,
  getInvoiceSchema
};
