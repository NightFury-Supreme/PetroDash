const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const User = require('../../models/User');
const profileController = require('./profile.controller');

const router = express.Router();

// Username availability check (public / profile edit)
router.get('/check-username', async (req, res) => {
  const user = await User.findOne({ username: req.query.username }).lean();
  res.json({ available: !user });
});

router.use(requireAuth);

router.patch('/profile', profileController.updateProfile);
router.delete('/profile', profileController.deleteAccount);
router.patch('/profile/email', profileController.initiateEmailChange);
router.post('/profile/email/verify', profileController.verifyEmailChange);
router.patch('/profile/password', profileController.updatePassword);

// 2FA
router.post('/2fa/setup', profileController.setup2FA);
router.post('/2fa/enable', profileController.verify2FA);
router.post('/2fa/disable', profileController.disable2FA);

// Sessions
router.get('/sessions', profileController.getSessions);
router.delete('/sessions/:id', profileController.revokeSession);

module.exports = router;
