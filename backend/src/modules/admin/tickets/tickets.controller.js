const ticketsService = require('./tickets.service');

const getCounts = async (req, res, next) => {
  try {
    const counts = await ticketsService.getCounts();
    res.json(counts);
  } catch (error) {
    next(error);
  }
};

const listTickets = async (req, res, next) => {
  try {
    const result = await ticketsService.listTickets(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const result = await ticketsService.getMessages(req.params.id, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getTicket = async (req, res, next) => {
  try {
    const ticket = await ticketsService.getTicket(req.params.id);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

const addMessage = async (req, res, next) => {
  try {
    const result = await ticketsService.addMessage(req.params.id, req.body, req);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateTicket = async (req, res, next) => {
  try {
    const result = await ticketsService.updateTicket(req.params.id, req.body, req);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const deleteTicket = async (req, res, next) => {
  try {
    const result = await ticketsService.deleteTicket(req.params.id, req);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await ticketsService.getCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

const getCategoryUsage = async (req, res, next) => {
  try {
    const usage = await ticketsService.getCategoryUsage();
    res.json(usage);
  } catch (error) {
    next(error);
  }
};

const updateCategories = async (req, res, next) => {
  try {
    const result = await ticketsService.updateCategories(req.body.categories, req);
    res.json(result);
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
  updateCategories
};
