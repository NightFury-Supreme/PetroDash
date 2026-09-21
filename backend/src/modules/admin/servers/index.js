/* ==========================================================================
   Admin Servers Module Barrel
   Compliance: ISO/IEC 25010, Barrel Pattern
========================================================================== */

const serversAdminController = require('./servers.admin.controller');
const serversAdminService = require('./servers.admin.service');
const serversAdminSchema = require('./servers.admin.schema');

module.exports = {
  ...serversAdminController,
  service: serversAdminService,
  schema: serversAdminSchema,
};
