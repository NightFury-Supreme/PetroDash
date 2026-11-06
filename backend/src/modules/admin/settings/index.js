const settingsController = require('./settings.controller');
const settingsTabsService = require('./settings.tabs.service');
const settingsSchemas = require('./settings.schema');

module.exports = {
  ...settingsController,
  settingsController,
  settingsTabsService,
  settingsSchemas,
};
