const locationController = require('./location.controller');
const locationService = require('./location.service');
const locationRoutes = require('./location.routes');
const locationSchemas = require('./location.schema');

module.exports = {
  locationController,
  locationService,
  locationRoutes,
  ...locationSchemas,
};
