/* ==========================================================================
   Admin Locations Module Barrel Export
   Compliance: ISO/IEC 25010, Barrel Pattern
========================================================================== */

const controller = require('./locations.controller');
const service = require('./locations.service');
const schemas = require('./locations.schema');

module.exports = {
  ...controller,
  service,
  schemas,
};
