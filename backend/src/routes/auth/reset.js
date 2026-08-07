const express = require('express');
 
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const User = require('../../models/User');
const VerificationToken = require('../../models/VerificationToken');
const { hashString, validatePasswordStrength } = require('../../utils/security');
const { verificationRateLimit } = require('../../middleware/rateLimit');

const router = express.Router();

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().length(8),
  newPassword: z.string().min(12).max(200)
});

router.post('/reset', verificationRateLimit, async (req, res) => {
  try {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const { email, code, newPassword } = parsed.data;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet security requirements', 
        details: passwordValidation.errors 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Simulate processing time to prevent enumeration
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    const codeHash = hashString(code);
    // Scope lookup to this user to prevent cross-user token use
    const vt = await VerificationToken.findOne({ tokenHash: codeHash, purpose: 'password_reset', usedAt: null, userId: user._id });
    if (!vt) return res.status(400).json({ error: 'Invalid or expired code' });
    
    // Check if token is locked due to too many attempts
    if (vt.lockedUntil && vt.lockedUntil > new Date()) {
      return res.status(429).json({ 
        error: 'Too many failed attempts. Please request a new code.',
        retryAfter: Math.ceil((vt.lockedUntil - new Date()) / 1000)
      });
    }
    
    if (vt.expiresAt && vt.expiresAt < new Date()) return res.status(400).json({ error: 'Code has expired' });

    // VULNERABILITY FIX: Use atomic increment to prevent concurrent brute-forcing
    const updatedVt = await VerificationToken.findOneAndUpdate(
      { _id: vt._id },
      { $inc: { attempts: 1 } },
      { new: true }
    );
    
    // Check if max attempts exceeded
    if (updatedVt.attempts >= updatedVt.maxAttempts) {
      updatedVt.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      await updatedVt.save();
      return res.status(429).json({ 
        error: 'Too many failed attempts. Please request a new code.',
        retryAfter: 900
      });
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

    return res.json({ ok: true });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    // Error logged silently for production
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;