const jwt = require('jsonwebtoken');

const User = require('../../models/User');
const VerificationToken = require('../../models/VerificationToken');
const UserCreationService = require('../../services/userCreation');
const { getSettings } = require('../../lib/settings');
const { generateSecureCode, hashString } = require('../../utils/security');
const { sendMailTemplate } = require('../../lib/mail');
const { deleteCache } = require('../../lib/redis');
const { invalidateUserCaches } = require('../../utils/userCacheInvalidation');
const { writeAudit } = require('../../middleware/audit');
const { logUserActivity } = require('../../middleware/userActivity');
const { buildIdFilter } = require('../../utils/publicId');
const AppError = require('../../utils/AppError');

async function resolveEmailFromRequest(req) {
  if (req.body?.email && typeof req.body.email === 'string' && req.body.email.includes('@')) {
    return req.body.email.trim();
  }
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
      if (decoded?.sub) {
        const u = await User.findOne(buildIdFilter(decoded.sub)).select('email').lean();
        if (u?.email) return u.email;
      }
    } catch (_jwtErr) {}
  }
  return null;
}

async function resendVerification(req) {
  try {
    const email = await resolveEmailFromRequest(req);
    if (!email) {
      throw AppError.badRequest('Valid email is required', 'ERR_INVALID_PAYLOAD');
    }

    const user = await User.findOne({ email });
    if (!user) return { ok: true };
    if (user.emailVerified) return { ok: true, alreadyVerified: true };

    const existingToken = await VerificationToken.findOne({ userId: user._id, purpose: 'email_verification', usedAt: null }).sort({ createdAt: -1 });
    if (existingToken && Date.now() - existingToken.createdAt.getTime() < 60 * 1000) {
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
      maxAttempts: 5,
    });

    try {
      const settings = await getSettings();
      await sendMailTemplate({
        to: user.email,
        templateKey: 'accountCreateWithVerification',
        data: {
          username: user.username,
          verificationCode,
          siteName: settings?.siteName || '',
        },
      });
    } catch (mailErr) {
      await writeAudit(req, 'auth.email.send_failed', 'auth', user.publicId, {
        template: 'accountCreateWithVerification',
        error: mailErr.message,
      }).catch(() => {});
      throw AppError.internal('Failed to send verification email', 'ERR_MAIL_SEND_FAILED');
    }

    await logUserActivity(req, 'auth.email.verify.resent', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }, user.publicId);
    await writeAudit(req, 'auth.email.verify.resent', 'auth', user.publicId, { email });

    return { ok: true };
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw AppError.internal('Failed to send verification code', 'ERR_VERIFY_RESEND_FAILED');
  }
}

async function verifyEmailCode(req, code) {
  try {
    const email = await resolveEmailFromRequest(req);
    if (!email || !code || code.length !== 8) {
      throw AppError.badRequest('Valid email and 8-digit verification code are required', 'ERR_INVALID_PAYLOAD');
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw AppError.badRequest('Invalid or expired verification code', 'ERR_INVALID_CODE');
    }

    if (user.emailVerified) {
      return { ok: true, alreadyVerified: true };
    }

    const codeHash = hashString(code);
    const vt = await VerificationToken.findOne({
      tokenHash: codeHash,
      purpose: 'email_verification',
      usedAt: null,
      userId: user._id,
    });

    if (!vt) {
      throw AppError.badRequest('Invalid or expired verification code', 'ERR_INVALID_CODE');
    }

    if (vt.lockedUntil && vt.lockedUntil > new Date()) {
      throw AppError.badRequest('Too many failed attempts. Please try again later.', 'ERR_RATE_LIMIT', {
        retryAfter: Math.ceil((vt.lockedUntil - new Date()) / 1000),
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
      await writeAudit(req, 'auth.email.verify.locked', 'auth', user.publicId, { email });
      await logUserActivity(req, 'auth.email.verify.locked', { ip: req.ip, userAgent: req.get('User-Agent') }, user.publicId);
      throw AppError.badRequest('Too many failed attempts. Please request a new code.', 'ERR_RATE_LIMIT', { retryAfter: 900 });
    }

    user.emailVerified = true;
    await user.save();

    updatedVt.usedAt = new Date();
    await updatedVt.save();

    await invalidateUserCaches(user.publicId);
    await UserCreationService.grantReferralRewards(user);

    const changes = { emailVerified: { old: false, new: true } };
    await logUserActivity(req, 'auth.email.verified', {
      method: 'code',
      changes,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }, user.publicId);
    await writeAudit(req, 'auth.email.verified', 'auth', user.publicId, { method: 'code', changes });

    return { ok: true };
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw AppError.internal('Failed to verify code', 'ERR_VERIFY_CODE_FAILED');
  }
}

module.exports = {
  resendVerification,
  verifyEmailCode,
};
