/**
 * Admin Tickets Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const ticketsController = require('./tickets.controller');
const ticketsService = require('./tickets.service');

module.exports = {
  ticketsController,
  ticketsService,
};
