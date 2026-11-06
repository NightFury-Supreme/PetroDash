const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const {
  createRateLimiter,
  loginRateLimit,
  registrationRateLimit,
  verificationRateLimit,
  resendRateLimit,
  passwordResetRateLimit,
} = require('../../middleware/rateLimit');
const { handleAvatarUpload } = require('../../middleware/avatarUpload');
const { authController } = require('../../modules/auth');
const { profileRoutes } = require('../../modules/profile');

const router = express.Router();

router.get('/me', requireAuth, authController.getMe);
router.post('/me/picture/upload', requireAuth, createRateLimiter(15, 60 * 1000), handleAvatarUpload('avatar'), authController.uploadProfilePicture);
router.post('/me/picture/sync', requireAuth, createRateLimiter(15, 60 * 1000), authController.syncOAuthAvatar);
router.delete('/me/picture', requireAuth, createRateLimiter(15, 60 * 1000), authController.deleteProfilePicture);
router.post('/login', loginRateLimit, authController.login);
router.post('/login/2fa', loginRateLimit, authController.login2fa);
router.post('/logout', authController.logout);
router.post('/register', registrationRateLimit, authController.register);
router.post('/verify/resend', resendRateLimit, authController.resendVerification);
router.post('/verify/code', verificationRateLimit, authController.verifyEmailCode);
router.post('/forgot', passwordResetRateLimit, authController.forgotPassword);
router.post('/reset', verificationRateLimit, authController.resetPassword);

router.use('/', profileRoutes);

module.exports = router;
