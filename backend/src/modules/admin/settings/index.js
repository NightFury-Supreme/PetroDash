/**
 * Admin Settings Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const settingsController = require('./settings.controller');
const settingsService = require('./settings.service');

module.exports = {
  settingsController,
  settingsService,
};
