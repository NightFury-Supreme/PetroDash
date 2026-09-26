/**
 * Admin Plans Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const plansController = require('./plans.controller');
const plansService = require('./plans.service');
const plansSchemas = require('./plans.schema');

module.exports = {
  plansController,
  plansService,
  plansSchemas,
};

