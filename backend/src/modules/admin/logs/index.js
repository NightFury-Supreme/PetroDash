const { getLogsHandler } = require('./logs.controller');
const { getLogs } = require('./logs.service');
const { logsQuerySchema } = require('./logs.schema');

module.exports = {
  getLogsHandler,
  getLogs,
  logsQuerySchema,
};
