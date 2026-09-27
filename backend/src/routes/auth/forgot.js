const express = require('express');
const { z } = require('zod');

const User = require('../../models/User');
const Settings = require('../../models/Settings');
const VerificationToken = require('../../models/VerificationToken');
const { generateSecureCode, hashString } = require('../../utils/security');
const { passwordResetRateLimit } = require('../../middleware/rateLimit');
const { sendMailTemplate } = require('../../lib/mail');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');
const AppError = require('../../utils/AppError');

const router = express.Router();

const forgotSchema = z.object({ email: z.string().email() });

router.post('/forgot', passwordResetRateLimit, async (req, res, next) => {
  try {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));
    }
    const { email } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) return res.json({ ok: true });

    const resetCode = generateSecureCode(8);
    const codeHash = hashString(resetCode);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

    await VerificationToken.deleteMany({ userId: user._id, purpose: 'password_reset', usedAt: null });
    await VerificationToken.create({
      userId: user._id,
      tokenHash: codeHash,
      purpose: 'password_reset',
      expiresAt,
      attempts: 0,
      maxAttempts: 5
    });

    try {
      const settings = await Settings.findOne({}).lean();
      await sendMailTemplate({
        to: user.email,
        templateKey: 'passwordReset',
        data: {
          username: user.username,
          verificationCode: resetCode,
          siteName: settings?.siteName || 'PteroDash'
        }
      });
    } catch {
      // Non-blocking mail dispatch
    }

    await logUserActivity(req, 'auth.password.reset.requested', {}, user._id.toString());
    await writeAudit(req, 'auth.password.reset.requested', 'auth', user._id.toString(), {});

    return res.json({ ok: true });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return next(AppError.internal('Failed to initiate password reset', 'ERR_PASSWORD_RESET_FAILED'));
  }
});

module.exports = router;
