/**
 * Earn Module Barrel Export
 */

const earnController = require('./earn.controller');
const earnService = require('./earn.service');
const earnRoutes = require('./earn.routes');
const earnSchemas = require('./earn.schema');

module.exports = {
  earnController,
  earnService,
  earnRoutes,
  ...earnSchemas
};
