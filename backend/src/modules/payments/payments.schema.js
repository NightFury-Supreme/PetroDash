const { z } = require('zod');
const { isValidEntityId } = require('../../utils/publicId');

const querySchema = z.object({
  paginate: z.enum(['true', 'false']).optional(),
  page: z.string().regex(/^\d+$/, 'ERR_INVALID_PAGE').optional(),
  pageSize: z.string().regex(/^\d+$/, 'ERR_INVALID_PAGE_SIZE').optional(),
});

const getInvoiceSchema = z.object({
  id: z.string().refine((val) => isValidEntityId(val, 'payment'), {
    message: 'Invalid payment ID format',
  }),
});

module.exports = {
  querySchema,
  getInvoiceSchema
};
