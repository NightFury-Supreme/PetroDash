/**
 * Admin Plans Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const plansController = require('./plans.controller');
const plansService = require('./plans.service');

module.exports = {
  plansController,
  plansService,
};
