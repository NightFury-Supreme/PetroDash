const express = require('express');
const crypto = require('crypto');
const { z } = require('zod');
const User = require('../../models/User');
const VerificationToken = require('../../models/VerificationToken');
const { generateSecureCode, hashString } = require('../../utils/security');
const { passwordResetRateLimit } = require('../../middleware/rateLimit');

const router = express.Router();

const forgotSchema = z.object({ email: z.string().email() });

router.post('/forgot', passwordResetRateLimit, async (req, res) => {
  try {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const { email } = parsed.data;

    const user = await User.findOne({ email });
    // Always return ok to avoid user enumeration
    if (!user) return res.json({ ok: true });

    // Generate secure 8-digit code
    const resetCode = generateSecureCode(8);
    const codeHash = hashString(resetCode);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    await VerificationToken.deleteMany({ userId: user._id, purpose: 'password_reset', usedAt: null });
    await VerificationToken.create({ 
      userId: user._id, 
      tokenHash: codeHash, 
      purpose: 'password_reset', 
      expiresAt,
      attempts: 0,
      maxAttempts: 5
    });

    const { sendMailTemplate } = require('../../lib/mail');
    try {
      await sendMailTemplate({
        to: user.email,
        templateKey: 'passwordReset',
        data: { 
          username: user.username, 
          verificationCode: resetCode,
          siteName: (await require('../../models/Settings').findOne({}).lean())?.siteName || 'PteroDash'
        }
      });
    } catch (e) {
      // Don't leak email errors to prevent enumeration
      // Email error logged silently for production
    }

    return res.json({ ok: true });
  } catch (e) {
    // Error logged silently for production
    return res.status(500).json({ error: 'Failed to initiate password reset' });
  }
});

module.exports = router;


