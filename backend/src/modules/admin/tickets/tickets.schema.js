/**
 * Admin Tickets Validation Schemas
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

const { z } = require('zod');

const ticketIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ticket ID format'),
});

const listTicketsQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().optional(),
  deleted: z.string().optional(),
  sort: z.string().optional().default('updated_desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  since: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

const addMessageSchema = z.object({
  body: z.string().trim().min(1, 'Message body required').max(5000, 'Message cannot exceed 5000 characters'),
  internal: z.boolean().optional().default(false),
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignee: z.string().regex(/^[0-9a-fA-F]{24}$/).nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  deletedByUser: z.boolean().optional(),
});

const updateCategoriesSchema = z.object({
  categories: z.array(z.string().trim().min(1).max(50)).min(1, 'At least one category is required'),
});

module.exports = {
  ticketIdParamSchema,
  listTicketsQuerySchema,
  getMessagesQuerySchema,
  addMessageSchema,
  updateTicketSchema,
  updateCategoriesSchema,
};
