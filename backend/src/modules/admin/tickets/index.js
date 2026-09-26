/**
 * Admin Tickets Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const ticketsController = require('./tickets.controller');
const ticketsService = require('./tickets.service');
const ticketsSchemas = require('./tickets.schema');

module.exports = {
  ticketsController,
  ticketsService,
  ticketsSchemas,
};

