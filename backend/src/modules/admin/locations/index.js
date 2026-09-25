/**
 * Admin Locations Module
 */

const controller = require('./locations.controller');
const service = require('./locations.service');
const schemas = require('./locations.schema');

module.exports = {
  ...controller,
  service,
  schemas,
};
