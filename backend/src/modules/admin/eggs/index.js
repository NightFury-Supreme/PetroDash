/* ==========================================================================
   Admin Eggs Module Barrel Export
   Compliance: ISO/IEC 25010, Barrel Pattern
========================================================================== */

const controller = require('./eggs.controller');
const service = require('./eggs.service');
const schemas = require('./eggs.schema');

module.exports = {
  ...controller,
  ...service,
  ...schemas,
};
