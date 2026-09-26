/**
 * Admin Tickets Controller
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

const ticketsService = require('./tickets.service');
const AppError = require('../../../utils/AppError');
const {
  ticketIdParamSchema,
  listTicketsQuerySchema,
  getMessagesQuerySchema,
  addMessageSchema,
  updateTicketSchema,
  updateCategoriesSchema,
} = require('./tickets.schema');

const getCounts = async (req, res, next) => {
  try {
    const counts = await ticketsService.getCounts();
    return res.json(counts);
  } catch (error) {
    next(error);
  }
};

const listTickets = async (req, res, next) => {
  try {
    const parsed = listTicketsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid query parameters', 'ERR_TICKET_QUERY_INVALID', parsed.error.flatten());
    }
    const result = await ticketsService.listTickets(parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const paramParsed = ticketIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw AppError.badRequest('Invalid ticket ID format', 'ERR_INVALID_ID', paramParsed.error.flatten());
    }
    const queryParsed = getMessagesQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
      throw AppError.badRequest('Invalid query parameters', 'ERR_MESSAGES_QUERY_INVALID', queryParsed.error.flatten());
    }
    const result = await ticketsService.getMessages(paramParsed.data.id, queryParsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const getTicket = async (req, res, next) => {
  try {
    const paramParsed = ticketIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw AppError.badRequest('Invalid ticket ID format', 'ERR_INVALID_ID', paramParsed.error.flatten());
    }
    const ticket = await ticketsService.getTicket(paramParsed.data.id);
    return res.json(ticket);
  } catch (error) {
    next(error);
  }
};

const addMessage = async (req, res, next) => {
  try {
    const paramParsed = ticketIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw AppError.badRequest('Invalid ticket ID format', 'ERR_INVALID_ID', paramParsed.error.flatten());
    }
    const parsed = addMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid message payload', 'ERR_MESSAGE_VALIDATION_FAILED', parsed.error.flatten());
    }
    const result = await ticketsService.addMessage(paramParsed.data.id, parsed.data, req);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateTicket = async (req, res, next) => {
  try {
    const paramParsed = ticketIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw AppError.badRequest('Invalid ticket ID format', 'ERR_INVALID_ID', paramParsed.error.flatten());
    }
    const parsed = updateTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid ticket update payload', 'ERR_TICKET_VALIDATION_FAILED', parsed.error.flatten());
    }
    const result = await ticketsService.updateTicket(paramParsed.data.id, parsed.data, req);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const deleteTicket = async (req, res, next) => {
  try {
    const paramParsed = ticketIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw AppError.badRequest('Invalid ticket ID format', 'ERR_INVALID_ID', paramParsed.error.flatten());
    }
    const result = await ticketsService.deleteTicket(paramParsed.data.id, req);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await ticketsService.getCategories();
    return res.json(categories);
  } catch (error) {
    next(error);
  }
};

const getCategoryUsage = async (req, res, next) => {
  try {
    const usage = await ticketsService.getCategoryUsage();
    return res.json(usage);
  } catch (error) {
    next(error);
  }
};

const updateCategories = async (req, res, next) => {
  try {
    const parsed = updateCategoriesSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid categories payload', 'ERR_CATEGORIES_VALIDATION_FAILED', parsed.error.flatten());
    }
    const result = await ticketsService.updateCategories(parsed.data.categories, req);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCounts,
  listTickets,
  getMessages,
  getTicket,
  addMessage,
  updateTicket,
  deleteTicket,
  getCategories,
  getCategoryUsage,
  updateCategories,
};
