const fs = require('fs');

const serviceCode = `
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

class ProfileService {
  async updateProfile(userId, { username, firstName, lastName }) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Not found');
    
    if (username && username !== user.username) {
      const exists = await User.findOne({ username }).lean();
      if (exists) {
        const err = new Error('Username already in use');
        err.code = 'ERR_USERNAME_IN_USE';
        throw err;
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
        } catch (queueErr) {
          console.error('Failed to queue Pterodactyl update:', queueErr.message);
        }
      }
    }
    
    return { user, changes: { old: oldValues, new: { username: user.username, firstName: user.firstName, lastName: user.lastName } } };
  }

  async initiateEmailChange(userId, newEmail) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Not found');
    
    const exists = await User.findOne({ email: newEmail }).lean();
    if (exists) {
      const err = new Error('Email already in use');
      err.code = 'ERR_EMAIL_IN_USE';
      throw err;
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
      }).catch(e => console.error(e));
      
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
    if (!user) throw new Error('Not found');
    
    const tokenRecord = await VerificationToken.findOne({ userId: user._id, purpose: 'email_change', newEmail, usedAt: null }).sort({ createdAt: -1 });
    if (!tokenRecord) { const e = new Error('Expired'); e.code = 'ERR_TOKEN_EXPIRED'; throw e; }
    if (tokenRecord.expiresAt < new Date()) { const e = new Error('Expired'); e.code = 'ERR_TOKEN_EXPIRED'; throw e; }
    if (tokenRecord.lockedUntil && tokenRecord.lockedUntil > new Date()) { const e = new Error('Rate limit'); e.code = 'ERR_RATE_LIMIT'; throw e; }
    
    const inputHash = hashString(code);
    if (inputHash !== tokenRecord.tokenHash) {
      tokenRecord.attempts += 1;
      if (tokenRecord.attempts >= tokenRecord.maxAttempts) tokenRecord.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await tokenRecord.save();
      const e = new Error('Invalid code'); e.code = 'ERR_INVALID_CODE'; throw e;
    }
    
    const exists = await User.findOne({ email: newEmail }).lean();
    if (exists && String(exists._id) !== String(user._id)) {
      const e = new Error('In use'); e.code = 'ERR_EMAIL_IN_USE'; throw e;
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
    if (!user) throw new Error('Not found');
    
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) { const e = new Error('Invalid'); e.code = 'ERR_INVALID_PASSWORD'; throw e; }
    
    if (user.tfaEnabled) {
      if (!tfaCode) { const e = new Error('2FA'); e.code = 'ERR_2FA_REQUIRED'; throw e; }
      let isValid = false;
      if (tfaCode.length === 6) {
        try { isValid = verifySync({ token: tfaCode, secret: user.tfaSecret })?.valid === true; } catch {}
      } else if (tfaCode.length === 8 && user.tfaBackupCodes && user.tfaBackupCodes.includes(tfaCode)) {
        isValid = true;
        user.tfaBackupCodes = user.tfaBackupCodes.filter(c => c !== tfaCode);
      }
      if (!isValid) { const e = new Error('Invalid 2FA'); e.code = 'ERR_2FA_INVALID'; throw e; }
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
    if (!user) throw new Error('Not found');
    if (user.tfaEnabled) { const e = new Error('Enabled'); e.code = 'ERR_2FA_ALREADY_ENABLED'; throw e; }
    
    const s = await getSettings();
    const secret = generateSecret();
    const uri = generateURI({ serviceName: s?.siteName || 'PteroDash', accountName: user.email, secret });
    const qr = await qrcode.toDataURL(uri);
    return { secret, qr };
  }
  
  async verify2FA(userId, secret, code) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Not found');
    
    let isValid = false;
    try { isValid = verifySync({ token: code, secret })?.valid === true; } catch {}
    if (!isValid) { const e = new Error('Invalid'); e.code = 'ERR_2FA_INVALID'; throw e; }
    
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
    user.tfaEnabled = true;
    user.tfaSecret = secret;
    user.tfaBackupCodes = backupCodes;
    await user.save();
    return backupCodes;
  }
  
  async disable2FA(userId, password, code) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Not found');
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) { const e = new Error('Invalid'); e.code = 'ERR_INVALID_PASSWORD'; throw e; }
    
    let isValid = false;
    if (code.length === 6) {
      try { isValid = verifySync({ token: code, secret: user.tfaSecret })?.valid === true; } catch {}
    } else if (code.length === 8 && user.tfaBackupCodes && user.tfaBackupCodes.includes(code)) {
      isValid = true;
      user.tfaBackupCodes = user.tfaBackupCodes.filter(c => c !== code);
    }
    if (!isValid) { const e = new Error('Invalid'); e.code = 'ERR_2FA_INVALID'; throw e; }
    
    user.tfaEnabled = false;
    user.tfaSecret = null;
    user.tfaBackupCodes = [];
    await user.save();
    return true;
  }
  
  async getSessions(userId, currentSessionId) {
    const sessions = await UserSession.find({ userId }).sort({ lastActive: -1 }).lean();
    return sessions.map(s => ({ ...s, isCurrent: s.sessionId === currentSessionId }));
  }
  
  async revokeSession(userId, id, currentSessionId) {
    const session = await UserSession.findOne({ _id: id, userId });
    if (!session) { const e = new Error('Not found'); e.code = 'ERR_NOT_FOUND'; throw e; }
    if (session.sessionId === currentSessionId) { const e = new Error('Current'); e.code = 'ERR_CANNOT_REVOKE_CURRENT'; throw e; }
    await UserSession.deleteOne({ _id: id });
    deleteCache(`session:\${session.sessionId}`);
    return true;
  }
  
  async deleteAccount(userId, password, tfaCode) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Not found');
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) { const e = new Error('Invalid'); e.code = 'ERR_INVALID_PASSWORD'; throw e; }
    
    if (user.tfaEnabled) {
      if (!tfaCode) { const e = new Error('2FA'); e.code = 'ERR_2FA_REQUIRED'; throw e; }
      let isValid = false;
      if (tfaCode.length === 6) {
        try { isValid = verifySync({ token: tfaCode, secret: user.tfaSecret })?.valid === true; } catch {}
      } else if (tfaCode.length === 8 && user.tfaBackupCodes && user.tfaBackupCodes.includes(tfaCode)) {
        isValid = true;
      }
      if (!isValid) { const e = new Error('Invalid'); e.code = 'ERR_2FA_INVALID'; throw e; }
    }
    
    const servers = await Server.find({ userId: user._id });
    for (const server of servers) {
      try {
        if (server.pterodactylServerId) await deletePanelServer(server.pterodactylServerId);
      } catch (err) {
        console.error('Failed to delete server from panel during account deletion:', err.message);
      }
      await Server.deleteOne({ _id: server._id });
    }
    
    if (user.pterodactylUserId) {
      try { await deletePanelUser(user.pterodactylUserId); }
      catch (err) { console.error('Failed to delete user from panel:', err.message); }
    }
    
    await User.deleteOne({ _id: user._id });
    const sessions = await UserSession.find({ userId: user._id });
    for (const session of sessions) {
      deleteCache(`session:\${session.sessionId}`);
    }
    await UserSession.deleteMany({ userId: user._id });
    
    return true;
  }
}

module.exports = new ProfileService();
`;

const controllerCode = `
const profileService = require('./profile.service');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');
const AppError = require('../../utils/AppError');
const schemas = require('./profile.schema');

exports.updateProfile = async (req, res, next) => {
  try {
    const parsed = schemas.updateProfileSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid payload', parsed.error.flatten());
    
    const { user, changes } = await profileService.updateProfile(req.user.sub, parsed.data);
    
    await logUserActivity(req, 'auth.profile.update', { changes });
    await writeAudit(req, 'auth.profile.update', 'user_profile', req.user.sub, { changes });
    
    res.json({ ok: true });
  } catch (err) {
    if (err.code) next(AppError.badRequest(err.message, null, err.code));
    else next(err);
  }
};

exports.initiateEmailChange = async (req, res, next) => {
  try {
    const parsed = schemas.initiateEmailChangeSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid payload', parsed.error.flatten());
    
    const result = await profileService.initiateEmailChange(req.user.sub, parsed.data.email);
    
    if (!result.requiresVerification) {
      await logUserActivity(req, 'auth.email.update', { email: parsed.data.email });
      await writeAudit(req, 'auth.email.update', 'user_profile', req.user.sub, { email: parsed.data.email });
      return res.json({ ok: true, email: result.user.email });
    }
    
    res.json({ ok: true, requiresVerification: true, message: 'Verification code sent to new email' });
  } catch (err) {
    if (err.code) next(AppError.badRequest(err.message, null, err.code));
    else next(err);
  }
};

exports.verifyEmailChange = async (req, res, next) => {
  try {
    const parsed = schemas.verifyEmailChangeSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid payload', parsed.error.flatten());
    
    const { user, oldEmail } = await profileService.verifyEmailChange(req.user.sub, parsed.data.email, parsed.data.code);
    
    const changes = { email: { old: oldEmail, new: user.email } };
    await logUserActivity(req, 'auth.email.update', { changes });
    await writeAudit(req, 'auth.email.update', 'user_profile', req.user.sub, { changes });
    
    res.json({ ok: true, email: user.email });
  } catch (err) {
    if (err.code) next(AppError.badRequest(err.message, null, err.code));
    else next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const parsed = schemas.updatePasswordSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid payload', parsed.error.flatten());
    
    await profileService.updatePassword(req.user.sub, parsed.data.currentPassword, parsed.data.newPassword, parsed.data.tfaCode);
    
    const changes = { password: { old: '********', new: '********' } };
    await logUserActivity(req, 'auth.password.update', { changes });
    await writeAudit(req, 'auth.password.update', 'user_profile', req.user.sub, { changes });
    
    res.json({ ok: true });
  } catch (err) {
    if (err.code) next(AppError.badRequest(err.message, null, err.code));
    else next(err);
  }
};

exports.setup2FA = async (req, res, next) => {
  try {
    const result = await profileService.setup2FA(req.user.sub);
    res.json({ ok: true, secret: result.secret, qr: result.qr });
  } catch (err) {
    if (err.code) next(AppError.badRequest(err.message, null, err.code));
    else next(err);
  }
};

exports.verify2FA = async (req, res, next) => {
  try {
    const parsed = schemas.verifyTfaSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid payload', parsed.error.flatten());
    
    const backupCodes = await profileService.verify2FA(req.user.sub, parsed.data.secret, parsed.data.code);
    
    await logUserActivity(req, 'auth.2fa.enable');
    await writeAudit(req, 'auth.2fa.enable', 'user_profile', req.user.sub);
    
    res.json({ ok: true, backupCodes });
  } catch (err) {
    if (err.code) next(AppError.badRequest(err.message, null, err.code));
    else next(err);
  }
};

exports.disable2FA = async (req, res, next) => {
  try {
    const parsed = schemas.disableTfaSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid payload', parsed.error.flatten());
    
    await profileService.disable2FA(req.user.sub, parsed.data.password, parsed.data.code);
    
    await logUserActivity(req, 'auth.2fa.disable');
    await writeAudit(req, 'auth.2fa.disable', 'user_profile', req.user.sub);
    
    res.json({ ok: true });
  } catch (err) {
    if (err.code) next(AppError.badRequest(err.message, null, err.code));
    else next(err);
  }
};

exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await profileService.getSessions(req.user.sub, req.session?.id);
    res.json({ ok: true, sessions });
  } catch (err) {
    next(err);
  }
};

exports.revokeSession = async (req, res, next) => {
  try {
    await profileService.revokeSession(req.user.sub, req.params.id, req.session?.id);
    
    await logUserActivity(req, 'auth.session.revoke', { sessionId: req.params.id });
    await writeAudit(req, 'auth.session.revoke', 'user_profile', req.user.sub, { sessionId: req.params.id });
    
    res.json({ ok: true });
  } catch (err) {
    if (err.code) next(AppError.badRequest(err.message, null, err.code));
    else next(err);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const parsed = schemas.deleteAccountSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid payload', parsed.error.flatten());
    
    await profileService.deleteAccount(req.user.sub, parsed.data.password, parsed.data.tfaCode);
    
    await logUserActivity(req, 'auth.account.delete');
    await writeAudit(req, 'auth.account.delete', 'user_profile', req.user.sub);
    
    res.json({ ok: true });
  } catch (err) {
    if (err.code) next(AppError.badRequest(err.message, null, err.code));
    else next(err);
  }
};
`;

const routeCode = `
const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const profileController = require('./profile.controller');

const router = express.Router();

router.use(requireAuth);

router.patch('/profile', profileController.updateProfile);
router.post('/profile/email', profileController.initiateEmailChange);
router.post('/profile/email/verify', profileController.verifyEmailChange);
router.patch('/profile/password', profileController.updatePassword);
router.post('/profile/2fa/setup', profileController.setup2FA);
router.post('/profile/2fa/verify', profileController.verify2FA);
router.delete('/profile/2fa', profileController.disable2FA);
router.get('/profile/sessions', profileController.getSessions);
router.delete('/profile/sessions/:id', profileController.revokeSession);
router.delete('/profile', profileController.deleteAccount);

module.exports = router;
`;

fs.writeFileSync('c:/Users/Edwin Jilson/Downloads/project/backend/src/modules/profile/profile.service.js', serviceCode);
fs.writeFileSync('c:/Users/Edwin Jilson/Downloads/project/backend/src/modules/profile/profile.controller.js', controllerCode);
fs.writeFileSync('c:/Users/Edwin Jilson/Downloads/project/backend/src/modules/profile/profile.route.js', routeCode);
console.log('Backend profile refactored successfully!');
