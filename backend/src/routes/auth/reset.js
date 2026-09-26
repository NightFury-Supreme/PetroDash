const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const User = require('../../models/User');
const VerificationToken = require('../../models/VerificationToken');
const { hashString, validatePasswordStrength } = require('../../utils/security');
const { verificationRateLimit } = require('../../middleware/rateLimit');
const { logUserActivity } = require('../../middleware/userActivity');
const AppError = require('../../utils/AppError');

const router = express.Router();

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().length(8),
  newPassword: z.string().min(12).max(200)
});

router.post('/reset', verificationRateLimit, async (req, res, next) => {
  try {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten());
    }
    const { email, code, newPassword } = parsed.data;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw AppError.badRequest('Password does not meet security requirements', 'ERR_INVALID_PASSWORD', passwordValidation.errors);
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Simulate processing time to prevent enumeration
      await new Promise(resolve => setTimeout(resolve, 100));
      throw AppError.badRequest('Invalid or expired code', 'ERR_INVALID_CODE');
    }

    const codeHash = hashString(code);
    // Scope lookup to this user to prevent cross-user token use
    const vt = await VerificationToken.findOne({ tokenHash: codeHash, purpose: 'password_reset', usedAt: null, userId: user._id });
    if (!vt) {
      throw AppError.badRequest('Invalid or expired code', 'ERR_INVALID_CODE');
    }
    
    // Check if token is locked due to too many attempts
    if (vt.lockedUntil && vt.lockedUntil > new Date()) {
      throw AppError.badRequest('Too many failed attempts. Please request a new code.', 'ERR_RATE_LIMIT', {
        retryAfter: Math.ceil((vt.lockedUntil - new Date()) / 1000)
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
    
    // Check if max attempts exceeded
    if (updatedVt.attempts >= updatedVt.maxAttempts) {
      updatedVt.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      await updatedVt.save();
      throw AppError.badRequest('Too many failed attempts. Please request a new code.', 'ERR_RATE_LIMIT', { retryAfter: 900 });
    }

    // Hash the new password with bcrypt before saving
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Mark token as used
    updatedVt.usedAt = new Date();
    await updatedVt.save();

    // Invalidate all other password reset tokens for this user
    await VerificationToken.deleteMany({ 
      userId: user._id, 
      purpose: 'password_reset', 
      usedAt: null,
      _id: { $ne: vt._id }
    });

    const changes = { password: { old: '********', new: '********' } };
    await logUserActivity(req, 'auth.password.reset.success', { changes }, user._id.toString());
    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'auth.password.reset.success', 'auth', user._id.toString(), { changes });
    return res.json({ ok: true });
  } catch (e) {
    next(e instanceof AppError ? e : AppError.internal('Failed to reset password'));
  }
});

module.exports = router;