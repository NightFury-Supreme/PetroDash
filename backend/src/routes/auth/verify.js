const express = require('express');
const crypto = require('crypto');
const { z } = require('zod');
const User = require('../../models/User');
const VerificationToken = require('../../models/VerificationToken');
const { getSettings } = require('../../lib/settings');
const UserCreationService = require('../../services/userCreation');
const { generateSecureCode, hashString } = require('../../utils/security');
const { verificationRateLimit, resendRateLimit } = require('../../middleware/rateLimit');
const { logUserActivity } = require('../../middleware/userActivity');
const AppError = require('../../utils/AppError');

const router = express.Router();

const verifySchema = z.object({ token: z.string().min(32).max(256) });

router.get('/verify', async (req, res, next) => {
  try {
    const parsed = verifySchema.safeParse({ token: String(req.query.token || '') });
    if (!parsed.success) {
      throw AppError.badRequest('Invalid token', 'ERR_INVALID_CODE');
    }
    
    const raw = parsed.data.token;
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    
    const vt = await VerificationToken.findOne({ tokenHash, purpose: 'email_verification', usedAt: null });
    if (!vt) throw AppError.badRequest('Invalid or expired token', 'ERR_INVALID_CODE');
    
    if (vt.expiresAt && vt.expiresAt < new Date()) throw AppError.badRequest('Token expired', 'ERR_TOKEN_EXPIRED');
    
    const user = await User.findById(vt.userId);
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
    
    user.emailVerified = true;
    await user.save();
    vt.usedAt = new Date();
    await vt.save();

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern(`user:${user._id}:profile`);

    await UserCreationService.grantReferralRewards(user);
    
    const changes = { emailVerified: { old: false, new: true } };
    await logUserActivity(req, 'auth.email.verified', { method: 'link', changes }, user._id.toString());
    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'auth.email.verified', 'auth', user._id.toString(), { method: 'link', changes });
    const redirect = (process.env.FRONTEND_URL || 'http://localhost:3000') + '/dashboard?verified=1';
    const wantsRedirect = String(req.query.redirect || '1') !== '0';
    
    if (wantsRedirect) return res.redirect(302, redirect);
    return res.json({ ok: true });
  } catch (e) {
    next(e instanceof AppError ? e : AppError.internal('Failed to verify email'));
  }
});

const resendSchema = z.object({ email: z.string().email() });
const verifyCodeSchema = z.object({ 
  email: z.string().email(),
  code: z.string().length(8, 'Code must be 8 digits')
});

router.post('/verify/resend', resendRateLimit, async (req, res, next) => {
  try {
    const parsed = resendSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten());
    }
    const { email } = parsed.data;
    
    // Always return success to prevent user enumeration
    // But only send email if user exists and needs verification
    const user = await User.findOne({ email });
    if (!user) return res.json({ ok: true });
    if (user.emailVerified) return res.json({ ok: true, alreadyVerified: true });

    const existingToken = await VerificationToken.findOne({ userId: user._id, purpose: 'email_verification', usedAt: null }).sort({ createdAt: -1 });
    if (existingToken && (Date.now() - existingToken.createdAt.getTime() < 60 * 1000)) {
      const retryAfter = 60 - Math.floor((Date.now() - existingToken.createdAt.getTime()) / 1000);
      throw AppError.badRequest('Too many requests, please try again later.', 'ERR_RATE_LIMIT', { retryAfter });
    }

    // Generate secure 8-digit verification code
    const verificationCode = generateSecureCode(8);
    const codeHash = hashString(verificationCode);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
    
    // Delete any existing verification tokens for this user
    await VerificationToken.deleteMany({ userId: user._id, purpose: 'email_verification', usedAt: null });
    
    // Create new verification token with code
    await VerificationToken.create({ 
      userId: user._id, 
      tokenHash: codeHash, 
      purpose: 'email_verification', 
      expiresAt,
      attempts: 0,
      maxAttempts: 5
    });

    const { sendMailTemplate } = require('../../lib/mail');
    
    try {
      await sendMailTemplate({
        to: user.email,
        templateKey: 'accountCreateWithVerification',
        data: { 
          username: user.username, 
          verificationCode: verificationCode,
          siteName: (await getSettings())?.siteName || 'PteroDash' 
        },
      });
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (mailError) {
      // Don't leak email errors to prevent enumeration
    }
    
    return res.json({ ok: true });
  } catch (e) {
    next(e instanceof AppError ? e : AppError.internal('Failed to send verification code'));
  }
});

// POST /api/auth/verify/code - Verify email with code
router.post('/verify/code', verificationRateLimit, async (req, res, next) => {
  try {
    const parsed = verifyCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten());
    }
    
    const { email, code } = parsed.data;
    
    const user = await User.findOne({ email });
    if (!user) {
      // Simulate processing time to prevent enumeration
      await new Promise(resolve => setTimeout(resolve, 100));
      throw AppError.badRequest('Invalid or expired verification code', 'ERR_INVALID_CODE');
    }
    
    if (user.emailVerified) {
      return res.json({ ok: true, alreadyVerified: true });
    }

    const codeHash = hashString(code);
    
    // Find verification token — MUST be scoped to this user to prevent cross-account abuse
    const vt = await VerificationToken.findOne({ 
      tokenHash: codeHash, 
      purpose: 'email_verification', 
      usedAt: null,
      userId: user._id
    });
    
    if (!vt) {
      throw AppError.badRequest('Invalid or expired verification code', 'ERR_INVALID_CODE');
    }
    
    // Check if token is locked due to too many attempts
    if (vt.lockedUntil && vt.lockedUntil > new Date()) {
      throw AppError.badRequest('Too many failed attempts. Please try again later.', 'ERR_RATE_LIMIT', {
        retryAfter: Math.ceil((vt.lockedUntil - new Date()) / 1000)
      });
    }
    
    if (vt.expiresAt && vt.expiresAt < new Date()) {
      throw AppError.badRequest('Verification code has expired', 'ERR_TOKEN_EXPIRED');
    }
    
    const updatedVt = await VerificationToken.findOneAndUpdate(
      { _id: vt._id },
      { $inc: { attempts: 1 } },
      { new: true }
    );
    
    if (updatedVt.attempts >= updatedVt.maxAttempts) {
      updatedVt.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await updatedVt.save();
      throw AppError.badRequest('Too many failed attempts. Please request a new code.', 'ERR_RATE_LIMIT', { retryAfter: 900 });
    }
    
    // Verify the user
    user.emailVerified = true;
    await user.save();
    
    // Mark token as used
    updatedVt.usedAt = new Date();
    await updatedVt.save();

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern(`user:${user._id}:profile`);

    await UserCreationService.grantReferralRewards(user);
    
    const changes = { emailVerified: { old: false, new: true } };
    await logUserActivity(req, 'auth.email.verified', { method: 'code', changes }, user._id.toString());
    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'auth.email.verified', 'auth', user._id.toString(), { method: 'code', changes });
    return res.json({ ok: true });
  } catch (e) {
    next(e instanceof AppError ? e : AppError.internal('Failed to verify code'));
  }
});

module.exports = router;
