const { buildIdFilter } = require('../../utils/publicId');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifySync } = require('otplib');

const User = require('../../models/User');
const UserSession = require('../../models/UserSession');
const { getSettings } = require('../../lib/settings');
const { setCache, deleteCache } = require('../../lib/redis');
const { invalidateUserCaches } = require('../../utils/userCacheInvalidation');
const { writeAudit } = require('../../middleware/audit');
const { logUserActivity } = require('../../middleware/userActivity');
const AppError = require('../../utils/AppError');
const { assertNotBanned, finalizeLoginSession } = require('./auth.helpers');

async function login(req, { emailOrUsername, password }) {
  const startTime = Date.now();
  let user = null;

  try {
    const s = await getSettings();
    const emailLoginEnabled = s?.auth?.emailLogin ?? true;
    if (!emailLoginEnabled) {
      await writeAudit(req, 'auth.login.failed', 'auth', null, {
        reason: 'email_login_disabled',
        emailOrUsername,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      throw AppError.forbidden('Email login is disabled', 'ERR_EMAIL_LOGIN_DISABLED');
    }

    user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] }).select('+passwordHash');
    if (!user) {
      await writeAudit(req, 'auth.login.failed', 'auth', null, {
        reason: 'user_not_found',
        emailOrUsername,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      throw AppError.unauthorized('Invalid credentials', 'ERR_INVALID_CREDENTIALS');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      req.user = { publicId: user.publicId, role: user.role, username: user.username };
      await writeAudit(req, 'auth.login.failed', 'auth', user.publicId, {
        reason: 'invalid_password',
        emailOrUsername,
        userId: user.publicId,
        username: user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      await logUserActivity(req, 'auth.login.failed', {
        reason: 'invalid_password',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }, user.publicId);
      throw AppError.unauthorized('Invalid credentials', 'ERR_INVALID_CREDENTIALS');
    }

    await assertNotBanned(req, user, emailOrUsername);

    if (user.tfaEnabled) {
      const tempToken = jwt.sign({ sub: user.publicId, type: '2fa' }, process.env.JWT_SECRET, { expiresIn: '5m', algorithm: 'HS256' });
      return { requires2FA: true, tempToken };
    }

    return await finalizeLoginSession(req, user, 'email', startTime, { emailOrUsername });
  } catch (e) {
    if (e instanceof AppError) throw e;
    await writeAudit(req, 'auth.login.error', 'auth', user?.publicId || null, {
      reason: 'server_error',
      error: e.message,
      emailOrUsername,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime,
    });
    throw AppError.internal('Internal server error', 'ERR_INTERNAL_SERVER');
  }
}

async function login2fa(req, { tempToken, code }) {
  const startTime = Date.now();
  let userId = null;

  try {
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (_jwtErr) {
      throw AppError.unauthorized('Session expired, please log in again', 'ERR_SESSION_EXPIRED');
    }

    if (decoded.type !== '2fa') {
      throw AppError.unauthorized('Invalid token type', 'ERR_INVALID_TOKEN_TYPE');
    }

    userId = decoded.sub;
    const user = await User.findOne(buildIdFilter(userId)).select('+tfaSecret +tfaBackupCodes');
    if (!user || !user.tfaEnabled) {
      throw AppError.unauthorized('Invalid user or 2FA not enabled', 'ERR_2FA_NOT_ENABLED');
    }

    await assertNotBanned(req, user);

    let isValid = false;
    let usedBackupCode = false;

    if (code.length === 6) {
      try {
        isValid = verifySync({ token: code, secret: user.tfaSecret })?.valid === true;
      } catch (_verifyErr) {
        isValid = false;
      }
    } else if (code.length === 8 && user.tfaBackupCodes && user.tfaBackupCodes.includes(code)) {
      isValid = true;
      usedBackupCode = true;
      user.tfaBackupCodes = user.tfaBackupCodes.filter((c) => c !== code);
      await user.save();
    }

    if (!isValid) {
      req.user = { publicId: user.publicId, role: user.role, username: user.username };
      await writeAudit(req, 'auth.login.failed', 'auth', userId, {
        reason: 'invalid_2fa_code',
        userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      await logUserActivity(req, 'auth.login.failed', {
        reason: 'invalid_2fa_code',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }, userId);
      throw AppError.unauthorized(
        code.length === 8 ? 'Invalid backup code' : 'Invalid 2FA code',
        code.length === 8 ? 'ERR_INVALID_BACKUP_CODE' : 'ERR_INVALID_2FA_CODE'
      );
    }

    return await finalizeLoginSession(req, user, usedBackupCode ? 'email_2fa_backup' : 'email_2fa', startTime);
  } catch (e) {
    if (e instanceof AppError) throw e;
    await writeAudit(req, 'auth.login.error', 'auth', userId, {
      reason: 'server_error',
      error: e.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime,
    });
    throw AppError.internal('Internal server error', 'ERR_INTERNAL_SERVER');
  }
}

async function logout(req) {
  const startTime = Date.now();

  try {
    let user = null;
    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      let decoded = null;
      try {
        decoded = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
      } catch (_jwtErr) {
        decoded = null;
      }

      if (decoded?.sub) {
        user = await User.findOne(buildIdFilter(String(decoded.sub)));

        if (decoded.sessionId) {
          const session = await UserSession.findOneAndDelete(buildIdFilter(decoded.sessionId)).lean();
          await Promise.all([
            deleteCache(`session:valid:${decoded.sessionId}`),
            setCache(`session:valid:${decoded.sessionId}`, false, 3600),
            session?.publicId && session.publicId !== decoded.sessionId
              ? setCache(`session:valid:${session.publicId}`, false, 3600)
              : Promise.resolve(),
            user?.publicId ? deleteCache(`user:${user.publicId}:sessions`) : Promise.resolve(),
          ]).catch(() => {});
          req.sessionId = decoded.sessionId;
        }

        if (user?.publicId) {
          await invalidateUserCaches(user.publicId);
        }
      }

      req.user = user;
    }

    if (user?.publicId) {
      await logUserActivity(req, 'auth.logout', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }, user.publicId);
    }

    await writeAudit(req, 'auth.logout', 'auth', user?.publicId || null, {
      userId: user?.publicId || null,
      email: user?.email || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime,
      sessionId: req.sessionId || null,
    });

    return { ok: true, code: 'LOGGED_OUT_SUCCESS' };
  } catch (error) {
    await writeAudit(req, 'auth.logout.error', 'auth', null, {
      reason: 'server_error',
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime,
    });
    throw AppError.internal('Internal server error', 'ERR_INTERNAL_SERVER');
  }
}

module.exports = {
  login,
  login2fa,
  logout,
};
