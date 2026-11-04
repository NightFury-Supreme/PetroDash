const express = require('express');
const { loginRateLimit } = require('../../middleware/rateLimit');
const { authOAuthController, reconfigureStrategies } = require('../../modules/auth');

const router = express.Router();

router.get('/discord', loginRateLimit, authOAuthController.initiateDiscord);
router.get('/discord/callback', authOAuthController.authenticateDiscord, authOAuthController.callbackDiscord);
router.get('/google', loginRateLimit, authOAuthController.initiateGoogle);
router.get('/google/callback', authOAuthController.authenticateGoogle, authOAuthController.callbackGoogle);

module.exports = { router, reconfigureStrategies };
