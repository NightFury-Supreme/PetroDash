const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const User = require('../../models/User');
const VerificationToken = require('../../models/VerificationToken');
const { getSettings } = require('../../lib/settings');
const UserCreationService = require('../../services/userCreation');
const { generateSecureCode, hashString } = require('../../utils/security');
const { sendMailTemplate } = require('../../lib/mail');
const { deleteCache, deleteCachePattern } = require('../../lib/redis');
const { verificationRateLimit, resendRateLimit } = require('../../middleware/rateLimit');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');
const AppError = require('../../utils/AppError');

const router = express.Router();

const verifySchema = z.object({ token: z.string().min(32).max(256) });

async function resolveEmailFromRequest(req) {
  if (req.body?.email && typeof req.body.email === 'string' && req.body.email.includes('@')) {
    return req.body.email.trim();
  }
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET);
      if (decoded?.sub) {
        const u = await User.findById(decoded.sub).select('email').lean();
        if (u?.email) return u.email;
      }
    } catch {
      // Ignore token decode failure
    }
  }
  return null;
}

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

    await deleteCache(`user:auth:${user._id}`);
    await deleteCachePattern(`user:${user._id}:*`);
    await UserCreationService.grantReferralRewards(user);

    const changes = { emailVerified: { old: false, new: true } };
    await logUserActivity(req, 'auth.email.verified', { method: 'link', changes }, user._id.toString());
    await writeAudit(req, 'auth.email.verified', 'auth', user._id.toString(), { method: 'link', changes });

    const redirect = (process.env.FRONTEND_URL || 'http://localhost:3000') + '/dashboard?verified=1';
    const wantsRedirect = String(req.query.redirect || '1') !== '0';

    if (wantsRedirect) return res.redirect(302, redirect);
    return res.json({ ok: true });
  } catch (e) {
    next(e instanceof AppError ? e : AppError.internal('Failed to verify email'));
  }
});

router.post('/verify/resend', resendRateLimit, async (req, res, next) => {
  try {
    const email = await resolveEmailFromRequest(req);
    if (!email) {
      throw AppError.badRequest('Valid email is required', 'ERR_INVALID_PAYLOAD');
    }

    const user = await User.findOne({ email });
    if (!user) return res.json({ ok: true });
    if (user.emailVerified) return res.json({ ok: true, alreadyVerified: true });

    const existingToken = await VerificationToken.findOne({ userId: user._id, purpose: 'email_verification', usedAt: null }).sort({ createdAt: -1 });
    if (existingToken && (Date.now() - existingToken.createdAt.getTime() < 60 * 1000)) {
      const retryAfter = 60 - Math.floor((Date.now() - existingToken.createdAt.getTime()) / 1000);
      throw AppError.badRequest('Too many requests, please try again later.', 'ERR_RATE_LIMIT', { retryAfter });
    }

    const verificationCode = generateSecureCode(8);
    const codeHash = hashString(verificationCode);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

    await VerificationToken.deleteMany({ userId: user._id, purpose: 'email_verification', usedAt: null });
    await VerificationToken.create({
      userId: user._id,
      tokenHash: codeHash,
      purpose: 'email_verification',
      expiresAt,
      attempts: 0,
      maxAttempts: 5
    });

    try {
      const settings = await getSettings();
      await sendMailTemplate({
        to: user.email,
        templateKey: 'accountCreateWithVerification',
        data: {
          username: user.username,
          verificationCode,
          siteName: settings?.siteName || 'PteroDash'
        },
      });
    } catch {
      // Non-blocking — prevents email enumeration
    }

    await logUserActivity(req, 'auth.email.verify.resent', {}, user._id.toString());
    await writeAudit(req, 'auth.email.verify.resent', 'auth', user._id.toString(), { email });

    return res.json({ ok: true });
  } catch (e) {
    next(e instanceof AppError ? e : AppError.internal('Failed to send verification code'));
  }
});

async function handleVerifyCode(req, res, next) {
  try {
    const email = await resolveEmailFromRequest(req);
    const code = String(req.body?.code || '').trim();

    if (!email || code.length !== 8) {
      throw AppError.badRequest('Valid email and 8-digit verification code are required', 'ERR_INVALID_PAYLOAD');
    }

    const user = await User.findOne({ email });
    if (!user) {
      await new Promise(resolve => setTimeout(resolve, 100));
      throw AppError.badRequest('Invalid or expired verification code', 'ERR_INVALID_CODE');
    }

    if (user.emailVerified) {
      return res.json({ ok: true, alreadyVerified: true });
    }

    const codeHash = hashString(code);
    const vt = await VerificationToken.findOne({
      tokenHash: codeHash,
      purpose: 'email_verification',
      usedAt: null,
      userId: user._id
    });

    if (!vt) {
      throw AppError.badRequest('Invalid or expired verification code', 'ERR_INVALID_CODE');
    }

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

    user.emailVerified = true;
    await user.save();

    updatedVt.usedAt = new Date();
    await updatedVt.save();

    await deleteCache(`user:auth:${user._id}`);
    await deleteCachePattern(`user:${user._id}:*`);
    await UserCreationService.grantReferralRewards(user);

    const changes = { emailVerified: { old: false, new: true } };
    await logUserActivity(req, 'auth.email.verified', { method: 'code', changes }, user._id.toString());
    await writeAudit(req, 'auth.email.verified', 'auth', user._id.toString(), { method: 'code', changes });
    return res.json({ ok: true });
  } catch (e) {
    next(e instanceof AppError ? e : AppError.internal('Failed to verify code'));
  }
}

router.post('/verify/code', verificationRateLimit, handleVerifyCode);
router.post('/verify', verificationRateLimit, handleVerifyCode);

module.exports = router;
