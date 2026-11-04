/**
 * Admin Earn Module
 * Facade pattern barrel export (ISO/IEC 25010)
 */

const earnController = require('./earn.controller');
const earnService = require('./earn.service');
const { earnPatchSchema, getSessionsQuerySchema } = require('./earn.schema');

module.exports = {
  earnController,
  earnService,
  earnPatchSchema,
  getSessionsQuerySchema,
};
