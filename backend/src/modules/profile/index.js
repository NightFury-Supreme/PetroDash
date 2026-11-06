const profileController = require('./profile.controller');
const profileService = require('./profile.service');
const profileSecurityService = require('./profile.security.service');
const profileAccountService = require('./profile.account.service');
const profileSyncService = require('./profile.sync.service');
const profileRoutes = require('./profile.route');
const profileSchemas = require('./profile.schema');

module.exports = {
  profileController,
  profileService,
  profileSecurityService,
  profileAccountService,
  profileSyncService,
  profileRoutes,
  profileSchemas,
};
