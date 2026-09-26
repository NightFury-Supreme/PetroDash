/**
 * Server Module Barrel Export
 */

const serverController = require('./server.controller');
const serverService = require('./server.service');
const serverCreateService = require('./server.create.service');
const serverMutationService = require('./server.mutation.service');
const serverRoutes = require('./server.routes');
const serverSchemas = require('./server.schema');

module.exports = {
  serverController,
  serverService,
  serverCreateService,
  serverMutationService,
  serverRoutes,
  ...serverSchemas
};
