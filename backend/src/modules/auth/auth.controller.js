const AppError = require('../../utils/AppError');
const { writeAudit } = require('../../middleware/audit');
const schemas = require('./auth.schema');
const authService = require('./auth.service');
const authAccountService = require('./auth.account.service');
const authPasswordService = require('./auth.password.service');
const authVerifyService = require('./auth.verify.service');

exports.login = async (req, res, next) => {
  try {
    const parsed = schemas.loginSchema.safeParse(req.body);
    if (!parsed.success) {
      await writeAudit(req, 'auth.login.failed', 'auth', null, {
        reason: 'invalid_payload',
        details: parsed.error.flatten(),
        emailOrUsername: req.body?.emailOrUsername,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      return next(AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));
    }
    const result = await authService.login(req, parsed.data);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.login2fa = async (req, res, next) => {
  try {
    const parsed = schemas.login2faSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));
    }
    const result = await authService.login2fa(req, parsed.data);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const result = await authService.logout(req);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const parsed = schemas.registerSchema.safeParse(req.body);
    if (!parsed.success) {
      await writeAudit(req, 'auth.register.failed', 'auth', null, {
        reason: 'invalid_payload',
        details: parsed.error.flatten(),
        email: req.body?.email,
        username: req.body?.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      return next(AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));
    }
    const result = await authAccountService.register(req, parsed.data);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const parsed = schemas.forgotSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));
    }
    const result = await authPasswordService.forgotPassword(req, parsed.data);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const parsed = schemas.resetSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));
    }
    const result = await authPasswordService.resetPassword(req, parsed.data);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.resendVerification = async (req, res, next) => {
  try {
    const result = await authVerifyService.resendVerification(req);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.verifyEmailCode = async (req, res, next) => {
  try {
    const parsed = schemas.verifyCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(AppError.badRequest('Valid email and 8-digit verification code are required', 'ERR_INVALID_PAYLOAD'));
    }
    const result = await authVerifyService.verifyEmailCode(req, parsed.data.code);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    const result = await authAccountService.getMe(req);
    return res.json(result);
  } catch (err) {
    return next(err instanceof AppError ? err : AppError.internal('Internal server error', 'ERR_INTERNAL_SERVER'));
  }
};

exports.uploadProfilePicture = async (req, res, next) => {
  try {
    const result = await authAccountService.uploadProfilePicture(req);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.syncOAuthAvatar = async (req, res, next) => {
  try {
    const result = await authAccountService.syncOAuthAvatar(req, req.body || {});
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.deleteProfilePicture = async (req, res, next) => {
  try {
    const result = await authAccountService.resetProfilePicture(req);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

