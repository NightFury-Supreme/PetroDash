/**
 * Admin Payments Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const paymentsController = require('./payments.controller');
const paymentsService = require('./payments.service');
const paymentsSchemas = require('./payments.schema');

module.exports = {
  paymentsController,
  paymentsService,
  paymentsSchemas,
};

