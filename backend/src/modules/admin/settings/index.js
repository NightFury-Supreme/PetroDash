/**
 * Admin Settings Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const settingsController = require('./settings.controller');
const settingsService = require('./settings.service');
const settingsSchemas = require('./settings.schema');

module.exports = {
  settingsController,
  settingsService,
  settingsSchemas,
};

