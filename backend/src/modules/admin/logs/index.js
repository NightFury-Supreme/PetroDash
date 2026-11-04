/* ==========================================================================
   Admin Logs Module Barrel Export
   Compliance: ISO/IEC 25010, OWASP Secure SDLC (Module Encapsulation)
========================================================================== */

const { getLogsHandler } = require('./logs.controller');
const { getLogs } = require('./logs.service');
const { logsQuerySchema } = require('./logs.schema');

module.exports = {
  getLogsHandler,
  getLogs,
  logsQuerySchema,
};
