const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const {
  createRateLimiter,
  createSecureRateLimiter,
  verificationRateLimit,
} = require('../../middleware/rateLimit');
const profileController = require('./profile.controller');

const router = express.Router();

router.get('/username', createRateLimiter(30, 60 * 1000), profileController.checkUsername);

router.use(requireAuth);

router.patch('/profile', createRateLimiter(15, 60 * 1000), profileController.updateProfile);
router.delete('/profile', createSecureRateLimiter(5, 15 * 60 * 1000), profileController.deleteAccount);
router.patch('/profile/email', createRateLimiter(5, 60 * 60 * 1000), profileController.initiateEmailChange);
router.post('/profile/email/verify', verificationRateLimit, profileController.verifyEmailChange);
router.patch('/profile/password', createSecureRateLimiter(5, 15 * 60 * 1000), profileController.updatePassword);

router.post('/2fa/setup', createRateLimiter(5, 15 * 60 * 1000), profileController.setup2FA);
router.post('/2fa/enable', verificationRateLimit, profileController.verify2FA);
router.post('/2fa/disable', createSecureRateLimiter(5, 15 * 60 * 1000), profileController.disable2FA);

router.get('/sessions', profileController.getSessions);
router.delete('/sessions/:id', createRateLimiter(20, 60 * 1000), profileController.revokeSession);

module.exports = router;
