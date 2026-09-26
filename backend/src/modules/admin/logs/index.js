/**
 * Admin Logs Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const logsController = require('./logs.controller');
const logsService = require('./logs.service');
const logsSchemas = require('./logs.schema');

module.exports = {
  logsController,
  logsService,
  logsSchemas,
};

