const eggController = require('./egg.controller');
const eggService = require('./egg.service');
const eggRoutes = require('./egg.routes');
const eggSchemas = require('./egg.schema');

module.exports = {
  eggController,
  eggService,
  eggRoutes,
  ...eggSchemas,
};
