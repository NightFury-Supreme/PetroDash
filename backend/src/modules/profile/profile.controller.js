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
