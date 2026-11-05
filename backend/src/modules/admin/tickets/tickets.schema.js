const { z } = require('zod');
const { isValidEntityId } = require('../../../utils/publicId');

const ticketIdParamSchema = z.object({
  id: z.string().refine((val) => isValidEntityId(val, 'ticket'), 'Invalid ticket ID format'),
});

const listTicketsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().trim().max(100).optional(),
  deleted: z.enum(['0', '1', 'true', 'false', 'all']).optional(),
  sort: z.enum(['updated_desc', 'updated_asc', 'created_desc', 'created_asc', 'priority_desc', 'priority_asc']).optional().default('updated_desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().refine((val) => isValidEntityId(val, 'message'), 'Invalid message ID').optional(),
  since: z.string().refine((val) => isValidEntityId(val, 'message'), 'Invalid message ID').optional(),
});

const addMessageSchema = z.object({
  body: z.string().trim().min(1, 'ERR_MESSAGE_REQUIRED').max(5000, 'ERR_MESSAGE_MAX'),
  internal: z.boolean().optional().default(false),
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignee: z.string().refine((val) => isValidEntityId(val, 'user'), 'Invalid user ID').nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  deletedByUser: z.boolean().optional(),
});

const updateCategoriesSchema = z.object({
  categories: z.array(z.string().trim().min(1).max(50)).min(1, 'ERR_CATEGORY_REQUIRED').max(50, 'ERR_CATEGORY_MAX'),
});

module.exports = {
  ticketIdParamSchema,
  listTicketsQuerySchema,
  getMessagesQuerySchema,
  addMessageSchema,
  updateTicketSchema,
  updateCategoriesSchema,
};
