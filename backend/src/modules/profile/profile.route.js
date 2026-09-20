const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const profileController = require('./profile.controller');

const router = express.Router();

router.use(requireAuth);

router.patch('/profile', profileController.updateProfile);
router.delete('/profile', profileController.deleteAccount);
router.patch('/profile/email', profileController.initiateEmailChange);
router.post('/profile/email/verify', profileController.verifyEmailChange);
router.patch('/profile/password', profileController.updatePassword);

// 2FA
router.post('/2fa/setup', profileController.setup2FA);
router.post('/2fa/enable', profileController.verify2FA); // Was /2fa/enable in original
router.post('/2fa/disable', profileController.disable2FA); // Was /2fa/disable in original

// Sessions
router.get('/sessions', profileController.getSessions);
router.delete('/sessions/:id', profileController.revokeSession);

// Username check
router.get('/check-username', async (req, res) => {
  const User = require('../../models/User');
  const user = await User.findOne({ username: req.query.username }).lean();
  res.json({ available: !user });
});

module.exports = router;
