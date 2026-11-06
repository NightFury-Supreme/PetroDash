const User = require('../../models/User');
const VerificationToken = require('../../models/VerificationToken');
const { sendMailTemplate } = require('../../lib/mail');
const { getSettings } = require('../../lib/settings');
const { hashString } = require('../../utils/security');
const { generateSecret, generateURI, verifySync } = require('otplib');
const qrcode = require('qrcode');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const AppError = require('../../utils/AppError');
const { buildIdFilter } = require('../../utils/publicId');
const { getCache, setCache, deleteCache, acquireLock, releaseLock } = require('../../lib/redis');
const { invalidateUserCaches } = require('../../utils/userCacheInvalidation');
const { syncPanelUser } = require('./profile.sync.service');

class ProfileSecurityService {
  verifyUserTfaCode(user, code, consumeBackup = false) {
    if (!code) return false;
    if (code.length === 6) {
      try {
        return verifySync({ token: code, secret: user.tfaSecret })?.valid === true;
      } catch (_tfaErr) {
        return false;
      }
    }
    if (code.length === 8 && user.tfaBackupCodes?.includes(code)) {
      if (consumeBackup) {
        user.tfaBackupCodes = user.tfaBackupCodes.filter((c) => c !== code);
      }
      return true;
    }
    return false;
  }

  async invalidateUserCaches(userId) {
    await invalidateUserCaches(userId);
  }

  async initiateEmailChange(userId, newEmail) {
    const lockToken = await acquireLock(`user:mutation:${userId}`, 5000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
    }
    try {
      const user = await User.findOne(buildIdFilter(userId));
      if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

      const exists = await User.findOne({ email: newEmail }).select('_id').lean();
      if (exists) throw AppError.badRequest('Email already in use', 'ERR_EMAIL_IN_USE');

      const s = await getSettings();
      if (s?.requireEmailVerification) {
        const code = crypto.randomInt(10000000, 99999999).toString();
        await VerificationToken.deleteMany({ userId: user._id, purpose: 'email_change' });
        await VerificationToken.create({
          userId: user._id,
          tokenHash: hashString(code),
          purpose: 'email_change',
          newEmail,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });

        await sendMailTemplate({
          to: newEmail,
          templateKey: 'accountCreateWithVerification',
          data: { username: user.username, verificationCode: code },
        });

        return { requiresVerification: true };
      }

      const oldEmail = user.email;
      user.email = newEmail;
      await user.save();
      await this.invalidateUserCaches(user.publicId);

      await sendMailTemplate({
        to: oldEmail,
        templateKey: 'emailChanged',
        data: { username: user.username, newEmail: user.email },
      }).catch(() => {});

      await syncPanelUser(user);

      return { requiresVerification: false, user, oldEmail };
    } finally {
      await releaseLock(`user:mutation:${userId}`, lockToken);
    }
  }

  async verifyEmailChange(userId, newEmail, code) {
    const lockToken = await acquireLock(`user:mutation:${userId}`, 5000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
    }
    try {
      const user = await User.findOne(buildIdFilter(userId));
      if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

      const tokenRecord = await VerificationToken.findOne({
        userId: user._id,
        purpose: 'email_change',
        newEmail,
        usedAt: null,
      }).sort({ createdAt: -1 });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw AppError.badRequest('Expired', 'ERR_TOKEN_EXPIRED');
      }
      if (tokenRecord.lockedUntil && tokenRecord.lockedUntil > new Date()) {
        throw AppError.badRequest('Rate limit', 'ERR_RATE_LIMIT');
      }

      if (hashString(code) !== tokenRecord.tokenHash) {
        tokenRecord.attempts += 1;
        if (tokenRecord.attempts >= tokenRecord.maxAttempts) {
          tokenRecord.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        await tokenRecord.save();
        throw AppError.badRequest('Invalid code', 'ERR_INVALID_CODE');
      }

      const exists = await User.findOne({ email: newEmail }).select('publicId').lean();
      if (exists && exists.publicId !== user.publicId) {
        throw AppError.badRequest('In use', 'ERR_EMAIL_IN_USE');
      }

      tokenRecord.usedAt = new Date();
      await tokenRecord.save();

      const oldEmail = user.email;
      user.email = newEmail;
      user.emailVerified = true;
      await user.save();
      await this.invalidateUserCaches(user.publicId);

      await sendMailTemplate({
        to: oldEmail,
        templateKey: 'emailChanged',
        data: { username: user.username, newEmail: user.email },
      }).catch(() => {});

      await syncPanelUser(user);

      return { user, oldEmail };
    } finally {
      await releaseLock(`user:mutation:${userId}`, lockToken);
    }
  }

  async updatePassword(userId, currentPassword, newPassword, tfaCode) {
    const lockToken = await acquireLock(`user:mutation:${userId}`, 5000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
    }
    try {
      const user = await User.findOne(buildIdFilter(userId)).select('+passwordHash +tfaSecret +tfaBackupCodes');
      if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

      if (!user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        throw AppError.badRequest('Invalid password', 'ERR_INVALID_PASSWORD');
      }

      if (user.tfaEnabled) {
        if (!tfaCode) throw AppError.badRequest('2FA required', 'ERR_2FA_REQUIRED');
        if (!this.verifyUserTfaCode(user, tfaCode, true)) {
          throw AppError.badRequest('Invalid 2FA', 'ERR_2FA_INVALID');
        }
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();
      await this.invalidateUserCaches(user.publicId);

      await sendMailTemplate({
        to: user.email,
        templateKey: 'passwordChanged',
        data: { username: user.username },
      }).catch(() => {});

      return true;
    } finally {
      await releaseLock(`user:mutation:${userId}`, lockToken);
    }
  }

  async setup2FA(userId) {
    const user = await User.findOne(buildIdFilter(userId)).select('email tfaEnabled').lean();
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
    if (user.tfaEnabled) throw AppError.badRequest('2FA already enabled', 'ERR_2FA_ALREADY_ENABLED');

    const s = await getSettings();
    const secret = generateSecret();
    const uri = generateURI({ issuer: s?.siteName || '', label: user.email, secret });
    const qr = await qrcode.toDataURL(uri);
    await setCache(`2fa:pending:${userId}`, secret, 600);
    return { secret, qr };
  }

  async verify2FA(userId, secret, code) {
    const lockToken = await acquireLock(`user:mutation:${userId}`, 5000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
    }
    try {
      const user = await User.findOne(buildIdFilter(userId));
      if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

      let finalSecret = secret;
      if (!finalSecret) {
        finalSecret = await getCache(`2fa:pending:${userId}`);
      }
      if (!finalSecret) throw AppError.badRequest('2FA setup expired', 'ERR_2FA_SETUP_EXPIRED');

      let isValid = false;
      try {
        isValid = verifySync({ token: code, secret: finalSecret })?.valid === true;
      } catch (_verifyErr) {
        isValid = false;
      }
      if (!isValid) throw AppError.badRequest('Invalid 2FA code', 'ERR_2FA_INVALID');

      const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
      user.tfaEnabled = true;
      user.tfaSecret = finalSecret;
      user.tfaBackupCodes = backupCodes;
      await user.save();
      await deleteCache(`2fa:pending:${userId}`);
      await this.invalidateUserCaches(user.publicId);

      await sendMailTemplate({
        to: user.email,
        templateKey: 'twoFactorEnabled',
        data: { username: user.username },
      }).catch(() => {});

      return backupCodes;
    } finally {
      await releaseLock(`user:mutation:${userId}`, lockToken);
    }
  }

  async disable2FA(userId, password, code) {
    const lockToken = await acquireLock(`user:mutation:${userId}`, 5000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
    }
    try {
      const user = await User.findOne(buildIdFilter(userId)).select('+passwordHash +tfaSecret +tfaBackupCodes');
      if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

      if (user.passwordHash) {
        if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
          throw AppError.badRequest('Invalid password', 'ERR_INVALID_PASSWORD');
        }
      }
      if (!this.verifyUserTfaCode(user, code, true)) {
        throw AppError.badRequest('Invalid 2FA code', 'ERR_2FA_INVALID');
      }

      user.tfaEnabled = false;
      user.tfaSecret = null;
      user.tfaBackupCodes = [];
      await user.save();
      await this.invalidateUserCaches(user.publicId);

      await sendMailTemplate({
        to: user.email,
        templateKey: 'twoFactorDisabled',
        data: { username: user.username },
      }).catch(() => {});

      return true;
    } finally {
      await releaseLock(`user:mutation:${userId}`, lockToken);
    }
  }
}

module.exports = new ProfileSecurityService();
