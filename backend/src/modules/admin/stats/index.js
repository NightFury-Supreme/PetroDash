/**
 * Admin Stats Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const statsController = require('./stats.controller');
const statsService = require('./stats.service');
const { statsQuerySchema } = require('./stats.schema');

module.exports = {
  statsController,
  statsService,
  statsQuerySchema,
};
