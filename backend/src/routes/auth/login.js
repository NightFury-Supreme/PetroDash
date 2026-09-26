const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifySync } = require('otplib');

const User = require('../../models/User');
const UserSession = require('../../models/UserSession');
const { getSettings } = require('../../lib/settings');
const { writeAudit } = require('../../middleware/audit');
const { loginRateLimit } = require('../../middleware/rateLimit');
const { logUserActivity } = require('../../middleware/userActivity');
const SessionService = require('../../services/SessionService');
const { serializeAuthUser, sendLoginAlert } = require('./loginHelpers');
const AppError = require('../../utils/AppError');

const router = express.Router();

const loginSchema = z.object({ emailOrUsername: z.string().min(1), password: z.string().min(8) });
const login2faSchema = z.object({ tempToken: z.string(), code: z.string().min(6).max(8) });

router.post('/login', loginRateLimit, async (req, res, next) => {
  const startTime = Date.now();
  let user = null;
  
  try {
    const s = await getSettings();
    const emailLoginEnabled = s?.auth?.emailLogin ?? true;
    if (!emailLoginEnabled) {
      await writeAudit(req, 'auth.login.failed', 'auth', null, {
        reason: 'email_login_disabled',
        emailOrUsername: req.body.emailOrUsername,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return next(AppError.forbidden('Email login is disabled', 'ERR_EMAIL_LOGIN_DISABLED'));
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      await writeAudit(req, 'auth.login.failed', 'auth', null, {
        reason: 'invalid_payload',
        details: parsed.error.flatten(),
        emailOrUsername: req.body.emailOrUsername,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return next(AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));
    }
    
    const { emailOrUsername, password } = parsed.data;
    user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });
    
    if (!user) {
      await writeAudit(req, 'auth.login.failed', 'auth', null, {
        reason: 'user_not_found',
        emailOrUsername,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return next(AppError.unauthorized('Invalid credentials', 'ERR_INVALID_CREDENTIALS'));
    }
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await writeAudit(req, 'auth.login.failed', 'auth', user._id.toString(), {
        reason: 'invalid_password',
        emailOrUsername,
        userId: user._id.toString(),
        username: user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      await logUserActivity(req, 'auth.login.failed', { reason: 'invalid_password' }, user._id.toString());
      return next(AppError.unauthorized('Invalid credentials', 'ERR_INVALID_CREDENTIALS'));
    }
    
    if (user.tfaEnabled) {
      const tempToken = jwt.sign({ sub: user._id.toString(), type: '2fa' }, process.env.JWT_SECRET, { expiresIn: '5m' });
      return res.json({ requires2FA: true, tempToken });
    }

    const { token, session } = await SessionService.createSessionAndJwt(user, req);
    req.user = user;
    
    await writeAudit(req, 'auth.login.success', 'auth', user._id.toString(), {
      loginMethod: 'email',
      emailOrUsername,
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime,
      sessionId: session._id.toString()
    });

    const mockReq = { ...req, user: { sub: user._id.toString(), sessionId: session._id.toString() } };
    await logUserActivity(mockReq, 'auth.login.success', { loginMethod: 'email', sessionId: session._id.toString() }, user._id.toString());

    sendLoginAlert(user, req);
    
    return res.json({ 
      token, 
      user: serializeAuthUser(user),
    });
  } catch (e) {
    await writeAudit(req, 'auth.login.error', 'auth', user?._id?.toString() || null, {
      reason: 'server_error',
      error: e.message,
      emailOrUsername: req.body.emailOrUsername,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime
    });
    return next(AppError.internal('Internal server error', 'ERR_INTERNAL_SERVER'));
  }
});

router.post('/login/2fa', loginRateLimit, async (req, res, next) => {
  let userId = null;
  
  try {
    const parsed = login2faSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));
    }
    
    const { tempToken, code } = parsed.data;
    
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return next(AppError.unauthorized('Session expired, please log in again', 'ERR_SESSION_EXPIRED'));
    }
    
    if (decoded.type !== '2fa') {
      return next(AppError.unauthorized('Invalid token type', 'ERR_INVALID_TOKEN_TYPE'));
    }
    
    userId = decoded.sub;
    const user = await User.findById(userId);
    if (!user || !user.tfaEnabled) {
      return next(AppError.unauthorized('Invalid user or 2FA not enabled', 'ERR_2FA_NOT_ENABLED'));
    }
    
    let isValid = false;
    
    if (code.length === 6) {
      try { isValid = verifySync({ token: code, secret: user.tfaSecret })?.valid === true; } catch { isValid = false; }
    } else if (code.length === 8 && user.tfaBackupCodes && user.tfaBackupCodes.includes(code)) {
      isValid = true;
      user.tfaBackupCodes = user.tfaBackupCodes.filter(c => c !== code);
      await user.save();
    }
    
    if (!isValid) {
      await writeAudit(req, 'auth.login.failed', 'auth', userId, {
        reason: 'invalid_2fa_code',
        userId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return next(AppError.unauthorized(
        code.length === 8 ? 'Invalid backup code' : 'Invalid 2FA code',
        code.length === 8 ? 'ERR_INVALID_BACKUP_CODE' : 'ERR_INVALID_2FA_CODE'
      ));
    }
    
    const { token, session } = await SessionService.createSessionAndJwt(user, req);
    req.user = user;
    
    await writeAudit(req, 'auth.login.success', 'auth', user._id.toString(), {
      loginMethod: 'email_2fa',
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: session._id.toString()
    });

    const mockReq = { ...req, user: { sub: user._id.toString(), sessionId: session._id.toString() } };
    await logUserActivity(mockReq, 'auth.login.success', { loginMethod: 'email_2fa', sessionId: session._id.toString() }, user._id.toString());
    
    sendLoginAlert(user, req);
    
    return res.json({ 
      token, 
      user: serializeAuthUser(user),
    });
  } catch {
    return next(AppError.internal('Internal server error', 'ERR_INTERNAL_SERVER'));
  }
});

router.post('/logout', async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    let user = null;
    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(String(decoded.sub));
        
        if (decoded.sessionId) {
          await UserSession.findByIdAndDelete(decoded.sessionId);
          req.sessionId = decoded.sessionId;
        }
      } catch {
        // Invalid token during logout ignored
      }
      
      req.user = user;
    }
    
    await writeAudit(req, 'auth.logout', 'auth', user?._id?.toString() || null, {
      userId: user?._id?.toString() || null,
      username: user?.username || null,
      email: user?.email || null,
      role: user?.role || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime,
      sessionId: req.sessionId || null
    });
    
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    await writeAudit(req, 'auth.logout.error', 'auth', null, {
      reason: 'server_error',
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime
    });
    return next(AppError.internal('Internal server error', 'ERR_INTERNAL_SERVER'));
  }
});

module.exports = router;
