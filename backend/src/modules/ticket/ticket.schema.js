const { z } = require('zod');

const createTicketSchema = z.object({
  title: z
    .string({ required_error: 'Title is required', invalid_type_error: 'Title must be a string' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title cannot exceed 255 characters'),
  message: z
    .string({ required_error: 'Message is required', invalid_type_error: 'Message must be a string' })
    .trim()
    .min(3, 'Message must be at least 3 characters')
    .max(5000, 'Message cannot exceed 5000 characters'),
  category: z.string().trim().max(100).optional(),
  priority: z.enum(['low', 'medium', 'high', 'normal']).optional(),
});

const sendTicketMessageSchema = z.object({
  body: z
    .string({ required_error: 'Message is required', invalid_type_error: 'Message must be a string' })
    .trim()
    .min(1, 'Message is required')
    .max(5000, 'Message cannot exceed 5000 characters')
});

const updateTicketStatusSchema = z.object({
  action: z.enum(['resolved', 'reopen'], {
    required_error: 'Action is required',
    invalid_type_error: 'Invalid action. Allowed: resolved, reopen'
  })
});

module.exports = {
  createTicketSchema,
  sendTicketMessageSchema,
  updateTicketStatusSchema,
};
