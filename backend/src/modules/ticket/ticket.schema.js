const { z } = require('zod');

const createTicketSchema = z.object({
  title: z
    .string({ required_error: 'ERR_TITLE_REQUIRED', invalid_type_error: 'ERR_TITLE_REQUIRED' })
    .trim()
    .min(3, 'ERR_TITLE_MIN')
    .max(200, 'ERR_TITLE_MAX'),
  message: z
    .string({ required_error: 'ERR_MESSAGE_REQUIRED', invalid_type_error: 'ERR_MESSAGE_REQUIRED' })
    .trim()
    .min(3, 'ERR_MESSAGE_MIN')
    .max(5000, 'ERR_MESSAGE_MAX'),
  category: z.string().trim().max(100).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

const sendTicketMessageSchema = z.object({
  body: z
    .string({ required_error: 'ERR_MESSAGE_REQUIRED', invalid_type_error: 'ERR_MESSAGE_REQUIRED' })
    .trim()
    .min(1, 'ERR_MESSAGE_REQUIRED')
    .max(5000, 'ERR_MESSAGE_MAX')
});

const updateTicketStatusSchema = z.object({
  action: z
    .enum(['resolved', 'resolve', 'reopen'], {
      required_error: 'ERR_INVALID_ACTION',
      invalid_type_error: 'ERR_INVALID_ACTION'
    })
    .transform((val) => (val === 'resolve' ? 'resolved' : val))
});

const { isValidEntityId } = require('../../utils/publicId');

const ticketIdParamSchema = z.object({
  id: z.string().refine((val) => isValidEntityId(val, 'ticket'), 'ERR_INVALID_ID'),
});

const getMineQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(['open', 'pending', 'resolved', 'closed', 'all']).optional(),
  category: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(['updated_desc', 'updated_asc', 'created_desc', 'created_asc']).optional().default('updated_desc'),
});

module.exports = {
  createTicketSchema,
  sendTicketMessageSchema,
  updateTicketStatusSchema,
  ticketIdParamSchema,
  getMineQuerySchema,
};
