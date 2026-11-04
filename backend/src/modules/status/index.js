const statusController = require('./status.controller');
const statusService = require('./status.service');
const statusRoutes = require('./status.routes');
const statusSchemas = require('./status.schema');

module.exports = {
  statusController,
  statusService,
  statusRoutes,
  ...statusSchemas,
};
