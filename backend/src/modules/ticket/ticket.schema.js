const { z } = require('zod');

const createTicketSchema = z.object({
  title: z
    .string({ required_error: 'ERR_TITLE_REQUIRED', invalid_type_error: 'ERR_TITLE_REQUIRED' })
    .trim()
    .min(3, 'ERR_TITLE_MIN')
    .max(255, 'ERR_TITLE_MAX'),
  message: z
    .string({ required_error: 'ERR_MESSAGE_REQUIRED', invalid_type_error: 'ERR_MESSAGE_REQUIRED' })
    .trim()
    .min(3, 'ERR_MESSAGE_MIN')
    .max(5000, 'ERR_MESSAGE_MAX'),
  category: z.string().trim().max(100).optional(),
  priority: z.enum(['low', 'medium', 'high', 'normal']).optional(),
});

const sendTicketMessageSchema = z.object({
  body: z
    .string({ required_error: 'ERR_MESSAGE_REQUIRED', invalid_type_error: 'ERR_MESSAGE_REQUIRED' })
    .trim()
    .min(1, 'ERR_MESSAGE_REQUIRED')
    .max(5000, 'ERR_MESSAGE_MAX')
});

const updateTicketStatusSchema = z.object({
  action: z.enum(['resolved', 'reopen'], {
    required_error: 'ERR_INVALID_ACTION',
    invalid_type_error: 'ERR_INVALID_ACTION'
  })
});

module.exports = {
  createTicketSchema,
  sendTicketMessageSchema,
  updateTicketStatusSchema,
};
