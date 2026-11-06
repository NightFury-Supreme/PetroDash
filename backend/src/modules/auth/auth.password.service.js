const bcrypt = require('bcryptjs');

const User = require('../../models/User');
const UserSession = require('../../models/UserSession');
const VerificationToken = require('../../models/VerificationToken');
const { getSettings } = require('../../lib/settings');
const { generateSecureCode, hashString, validatePasswordStrength } = require('../../utils/security');
const { sendMailTemplate } = require('../../lib/mail');
const { deleteCache } = require('../../lib/redis');
const { invalidateUserCaches } = require('../../utils/userCacheInvalidation');
const { writeAudit } = require('../../middleware/audit');
const { logUserActivity } = require('../../middleware/userActivity');
const AppError = require('../../utils/AppError');

async function forgotPassword(req, { email }) {
  try {
    const user = await User.findOne({ email });
    if (!user) return { ok: true };

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
      maxAttempts: 5,
    });

    try {
      const settings = await getSettings();
      await sendMailTemplate({
        to: user.email,
        templateKey: 'passwordReset',
        data: {
          username: user.username,
          verificationCode: resetCode,
          siteName: settings?.siteName || '',
        },
      });
    } catch (mailErr) {
      await writeAudit(req, 'auth.email.send_failed', 'auth', user.publicId, {
        template: 'passwordReset',
        error: mailErr.message,
      }).catch(() => {});
      throw AppError.internal('Failed to send password reset email', 'ERR_MAIL_SEND_FAILED');
    }

    await logUserActivity(req, 'auth.password.reset.requested', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }, user.publicId);
    await writeAudit(req, 'auth.password.reset.requested', 'auth', user.publicId, { email });

    return { ok: true };
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw AppError.internal('Failed to initiate password reset', 'ERR_PASSWORD_RESET_FAILED');
  }
}

async function resetPassword(req, { email, code, newPassword }) {
  try {
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw AppError.badRequest('Password does not meet security requirements', 'ERR_INVALID_PASSWORD', passwordValidation.errors);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw AppError.badRequest('Invalid or expired code', 'ERR_INVALID_CODE');
    }

    const codeHash = hashString(code);
    const vt = await VerificationToken.findOne({ tokenHash: codeHash, purpose: 'password_reset', usedAt: null, userId: user._id });
    if (!vt) {
      throw AppError.badRequest('Invalid or expired code', 'ERR_INVALID_CODE');
    }

    if (vt.lockedUntil && vt.lockedUntil > new Date()) {
      throw AppError.badRequest('Too many failed attempts. Please request a new code.', 'ERR_RATE_LIMIT', {
        retryAfter: Math.ceil((vt.lockedUntil - new Date()) / 1000),
      });
    }

    if (vt.expiresAt && vt.expiresAt < new Date()) {
      throw AppError.badRequest('Code has expired', 'ERR_TOKEN_EXPIRED');
    }

    const updatedVt = await VerificationToken.findOneAndUpdate(
      { _id: vt._id },
      { $inc: { attempts: 1 } },
      { new: true }
    );

    if (updatedVt.attempts >= updatedVt.maxAttempts) {
      updatedVt.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await updatedVt.save();
      await writeAudit(req, 'auth.password.reset.locked', 'auth', user.publicId, { email });
      await logUserActivity(req, 'auth.password.reset.locked', { ip: req.ip, userAgent: req.get('User-Agent') }, user.publicId);
      throw AppError.badRequest('Too many failed attempts. Please request a new code.', 'ERR_RATE_LIMIT', { retryAfter: 900 });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    updatedVt.usedAt = new Date();
    await updatedVt.save();

    await VerificationToken.deleteMany({
      userId: user._id,
      purpose: 'password_reset',
      usedAt: null,
      _id: { $ne: vt._id },
    });

    const sessions = await UserSession.find({ userId: user._id }).select('publicId').lean();
    for (const s of sessions) {
      await deleteCache(`session:valid:${s.publicId}`);
    }
    await UserSession.deleteMany({ userId: user._id });
    await invalidateUserCaches(user.publicId);

    const changes = { password: { old: '********', new: '********' } };
    await logUserActivity(req, 'auth.password.reset.success', {
      changes,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }, user.publicId);
    await writeAudit(req, 'auth.password.reset.success', 'auth', user.publicId, { changes });

    return { ok: true, code: 'PASSWORD_RESET_SUCCESS' };
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw AppError.internal('Failed to reset password', 'ERR_PASSWORD_RESET_FAILED');
  }
}

module.exports = {
  forgotPassword,
  resetPassword,
};
