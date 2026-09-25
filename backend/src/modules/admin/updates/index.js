/**
 * Admin Updates Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const updatesController = require('./updates.controller');
const updatesService = require('./updates.service');

module.exports = {
  updatesController,
  updatesService,
};
