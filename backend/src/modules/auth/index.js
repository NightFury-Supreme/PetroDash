const authSchemas = require('./auth.schema');
const authHelpers = require('./auth.helpers');
const authService = require('./auth.service');
const authAccountService = require('./auth.account.service');
const authPasswordService = require('./auth.password.service');
const authVerifyService = require('./auth.verify.service');
const authOAuthService = require('./auth.oauth.service');
const authController = require('./auth.controller');
const authOAuthController = require('./auth.oauth.controller');

module.exports = {
  authSchemas,
  authHelpers,
  authService,
  authAccountService,
  authPasswordService,
  authVerifyService,
  authOAuthService,
  authController,
  authOAuthController,
  reconfigureStrategies: authOAuthService.reconfigureStrategies,
};
