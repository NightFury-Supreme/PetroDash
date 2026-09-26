const User = require('../../models/User');
const UserSession = require('../../models/UserSession');
const Server = require('../../models/Server');
const VerificationToken = require('../../models/VerificationToken');
const PendingUpdate = require('../../models/PendingUpdate');
const { updatePanelUser, deleteServer: deletePanelServer, deletePanelUser } = require('../../services/pterodactyl');
const { deleteCache } = require('../../lib/redis');
const { sendMailTemplate } = require('../../lib/mail');
const { getSettings } = require('../../lib/settings');
const { hashString } = require('../../utils/security');
const { generateSecret, generateURI, verifySync } = require('otplib');
const qrcode = require('qrcode');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const AppError = require('../../utils/AppError');

class ProfileService {
  async updateProfile(userId, { username, firstName, lastName }) {
    const user = await User.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    
    if (username && username !== user.username) {
      const exists = await User.findOne({ username }).lean();
      if (exists) {
        throw AppError.badRequest('Username already in use', null, 'ERR_USERNAME_IN_USE');
      }
    }
    
    const oldValues = { username: user.username, firstName: user.firstName, lastName: user.lastName };
    if (username !== undefined) user.username = username;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    
    await user.save();
    
    if (user.pterodactylUserId && (username || firstName || lastName)) {
      const payload = { email: user.email, username: user.username, first_name: user.firstName, last_name: user.lastName };
      try {
        await updatePanelUser(user.pterodactylUserId, payload);
      } catch {
        try {
          await PendingUpdate.create({ pterodactylUserId: user.pterodactylUserId, payload: JSON.stringify(payload) });
        } catch (_) {}
      }
    }
    
    return { user, changes: { old: oldValues, new: { username: user.username, firstName: user.firstName, lastName: user.lastName } } };
  }

  async initiateEmailChange(userId, newEmail) {
    const user = await User.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    
    const exists = await User.findOne({ email: newEmail }).lean();
    if (exists) {
      throw AppError.badRequest('Email already in use', null, 'ERR_EMAIL_IN_USE');
    }
    
    const s = await getSettings();
    if (s?.requireEmailVerification) {
      const code = crypto.randomInt(10000000, 99999999).toString();
      await VerificationToken.deleteMany({ userId: user._id, purpose: 'email_change' });
      await VerificationToken.create({
        userId: user._id,
        tokenHash: hashString(code),
        purpose: 'email_change',
        newEmail,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      });
      
      await sendMailTemplate({
        to: newEmail,
        templateKey: 'accountCreateWithVerification',
        data: { username: user.username, verificationCode: code, siteName: s?.siteName || 'PteroDash' }
      });
      
      return { requiresVerification: true };
    } else {
      const oldEmail = user.email;
      user.email = newEmail;
      await user.save();
      
      await sendMailTemplate({
        to: oldEmail,
        templateKey: 'emailChanged',
        data: { username: user.username, newEmail: user.email, siteName: s?.siteName || 'PteroDash' }
      }).catch(() => {});
      
      if (user.pterodactylUserId) {
        const payload = { email: user.email, username: user.username, first_name: user.firstName, last_name: user.lastName };
        try { await updatePanelUser(user.pterodactylUserId, payload); }
        catch { await PendingUpdate.create({ pterodactylUserId: user.pterodactylUserId, payload: JSON.stringify(payload) }).catch(e=>e); }
      }
      
      return { requiresVerification: false, user, oldEmail };
    }
  }

  async verifyEmailChange(userId, newEmail, code) {
    const user = await User.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    
    const tokenRecord = await VerificationToken.findOne({ userId: user._id, purpose: 'email_change', newEmail, usedAt: null }).sort({ createdAt: -1 });
    if (!tokenRecord) throw AppError.badRequest('Expired', null, 'ERR_TOKEN_EXPIRED');
    if (tokenRecord.expiresAt < new Date()) throw AppError.badRequest('Expired', null, 'ERR_TOKEN_EXPIRED');
    if (tokenRecord.lockedUntil && tokenRecord.lockedUntil > new Date()) throw AppError.badRequest('Rate limit', null, 'ERR_RATE_LIMIT');
    
    const inputHash = hashString(code);
    if (inputHash !== tokenRecord.tokenHash) {
      tokenRecord.attempts += 1;
      if (tokenRecord.attempts >= tokenRecord.maxAttempts) tokenRecord.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await tokenRecord.save();
      throw AppError.badRequest('Invalid code', null, 'ERR_INVALID_CODE');
    }
    
    const exists = await User.findOne({ email: newEmail }).lean();
    if (exists && String(exists._id) !== String(user._id)) {
      throw AppError.badRequest('In use', null, 'ERR_EMAIL_IN_USE');
    }
    
    tokenRecord.usedAt = new Date();
    await tokenRecord.save();
    
    const oldEmail = user.email;
    user.email = newEmail;
    user.emailVerified = true;
    await user.save();
    
    const s = await getSettings();
    await sendMailTemplate({
      to: oldEmail,
      templateKey: 'emailChanged',
      data: { username: user.username, newEmail: user.email, siteName: s?.siteName || 'PteroDash' }
    }).catch(e => e);
    
    if (user.pterodactylUserId) {
      const payload = { email: user.email, username: user.username, first_name: user.firstName, last_name: user.lastName };
      try { await updatePanelUser(user.pterodactylUserId, payload); }
      catch { await PendingUpdate.create({ pterodactylUserId: user.pterodactylUserId, payload: JSON.stringify(payload) }).catch(e=>e); }
    }
    
    return { user, oldEmail };
  }

  async updatePassword(userId, currentPassword, newPassword, tfaCode) {
    const user = await User.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw AppError.badRequest('Invalid password', null, 'ERR_INVALID_PASSWORD');
    
    if (user.tfaEnabled) {
      if (!tfaCode) throw AppError.badRequest('2FA required', null, 'ERR_2FA_REQUIRED');
      let isValid = false;
      if (tfaCode.length === 6) {
        try { isValid = verifySync({ token: tfaCode, secret: user.tfaSecret })?.valid === true; } catch {}
      } else if (tfaCode.length === 8 && user.tfaBackupCodes && user.tfaBackupCodes.includes(tfaCode)) {
        isValid = true;
        user.tfaBackupCodes = user.tfaBackupCodes.filter(c => c !== tfaCode);
      }
      if (!isValid) throw AppError.badRequest('Invalid 2FA', null, 'ERR_2FA_INVALID');
    }
    
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    const s = await getSettings();
    await sendMailTemplate({
      to: user.email,
      templateKey: 'passwordChanged',
      data: { username: user.username, siteName: s?.siteName || 'PteroDash' }
    }).catch(e => e);
    
    return true;
  }
  
  async setup2FA(userId) {
    const user = await User.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    if (user.tfaEnabled) throw AppError.badRequest('2FA already enabled', null, 'ERR_2FA_ALREADY_ENABLED');
    
    const s = await getSettings();
    const secret = generateSecret();
    const uri = generateURI({ issuer: s?.siteName || 'PteroDash', label: user.email, secret });
    const qr = await qrcode.toDataURL(uri);
    return { secret, qr };
  }
  
  async verify2FA(userId, secret, code) {
    const user = await User.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    
    let isValid = false;
    try { isValid = verifySync({ token: code, secret })?.valid === true; } catch {}
    if (!isValid) throw AppError.badRequest('Invalid 2FA code', null, 'ERR_2FA_INVALID');
    
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
    user.tfaEnabled = true;
    user.tfaSecret = secret;
    user.tfaBackupCodes = backupCodes;
    await user.save();
    return backupCodes;
  }
  
  async disable2FA(userId, password, code) {
    const user = await User.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw AppError.badRequest('Invalid password', null, 'ERR_INVALID_PASSWORD');
    
    let isValid = false;
    if (code.length === 6) {
      try { isValid = verifySync({ token: code, secret: user.tfaSecret })?.valid === true; } catch {}
    } else if (code.length === 8 && user.tfaBackupCodes && user.tfaBackupCodes.includes(code)) {
      isValid = true;
      user.tfaBackupCodes = user.tfaBackupCodes.filter(c => c !== code);
    }
    if (!isValid) throw AppError.badRequest('Invalid 2FA code', null, 'ERR_2FA_INVALID');
    
    user.tfaEnabled = false;
    user.tfaSecret = null;
    user.tfaBackupCodes = [];
    await user.save();
    return true;
  }
  
  async getSessions(userId, currentSessionId) {
    const sessions = await UserSession.find({ userId }).sort({ lastActive: -1 }).lean();
    return sessions.map(s => ({ 
      ...s, 
      id: s._id.toString(),
      current: s._id.toString() === currentSessionId 
    }));
  }
  
  async revokeSession(userId, id, currentSessionId) {
    const session = await UserSession.findOne({ _id: id, userId });
    if (!session) throw AppError.notFound('Session not found', null, 'ERR_NOT_FOUND');
    if (session._id.toString() === currentSessionId) throw AppError.badRequest('Cannot revoke current session', null, 'ERR_CANNOT_REVOKE_CURRENT');
    await UserSession.deleteOne({ _id: id });
    deleteCache(`session:${session.sessionId}`);
    return true;
  }
  
  async deleteAccount(userId, password, tfaCode) {
    const user = await User.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw AppError.badRequest('Invalid password', null, 'ERR_INVALID_PASSWORD');
    
    if (user.tfaEnabled) {
      if (!tfaCode) throw AppError.badRequest('2FA required', null, 'ERR_2FA_REQUIRED');
      let isValid = false;
      if (tfaCode.length === 6) {
        try { isValid = verifySync({ token: tfaCode, secret: user.tfaSecret })?.valid === true; } catch {}
      } else if (tfaCode.length === 8 && user.tfaBackupCodes && user.tfaBackupCodes.includes(tfaCode)) {
        isValid = true;
      }
      if (!isValid) throw AppError.badRequest('Invalid 2FA code', null, 'ERR_2FA_INVALID');
    }
    
    const servers = await Server.find({ userId: user._id });
    for (const server of servers) {
      try {
        if (server.pterodactylServerId) await deletePanelServer(server.pterodactylServerId);
      } catch (_) {}
      await Server.deleteOne({ _id: server._id });
    }
    
    if (user.pterodactylUserId) {
      try { await deletePanelUser(user.pterodactylUserId); }
      catch (_) {}
    }
    
    await User.deleteOne({ _id: user._id });
    const sessions = await UserSession.find({ userId: user._id });
    for (const session of sessions) {
      deleteCache(`session:${session.sessionId}`);
    }
    await UserSession.deleteMany({ userId: user._id });
    
    return true;
  }
}

module.exports = new ProfileService();
