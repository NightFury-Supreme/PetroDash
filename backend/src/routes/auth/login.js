const express = require('express');
const { z } = require('zod');
const User = require('../../models/User');
const { getSettings } = require('../../lib/settings');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { writeAudit } = require('../../middleware/audit');
const { loginRateLimit } = require('../../middleware/rateLimit');
const { logUserActivity } = require('../../middleware/userActivity');

const router = express.Router();

const SessionService = require('../../services/SessionService');
const { verifySync } = require('otplib');

const loginSchema = z.object({ emailOrUsername: z.string().min(1), password: z.string().min(8) });


router.post('/login', loginRateLimit, async (req, res) => {
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
      return res.status(403).json({ error: 'Email login is disabled' });
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
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
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
      return res.status(401).json({ error: 'Invalid credentials' });
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
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (user.tfaEnabled) {
      // Issue a temporary token for 2FA
      const tempToken = jwt.sign({ sub: user._id.toString(), type: '2fa' }, process.env.JWT_SECRET, { expiresIn: '5m' });
      return res.json({ requires2FA: true, tempToken });
    }

    const { token, session } = await SessionService.createSessionAndJwt(user, req);
    req.user = user;
    
    // Log successful login
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
    // For user activity we pass a mock req object to inject the new sessionId if req.user is not yet populated
    const mockReq = { ...req, user: { sub: user._id.toString(), sessionId: session._id.toString() } };
    await logUserActivity(mockReq, 'auth.login.success', { loginMethod: 'email', sessionId: session._id.toString() }, user._id.toString());

    // Send login alert email (non-blocking)
    try {
      const { sendMailTemplate } = require('../../lib/mail');
      await sendMailTemplate({
        to: user.email,
        templateKey: 'loginAlert',
        data: {
          ip: req.ip,
          userAgent: req.get('User-Agent') || '',
          time: new Date().toISOString(),
          username: user.username,
        }
      });
     
    } catch (_) {}
    
    return res.json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        username: user.username, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        role: user.role, 
        coins: Number(user.coins || 0), 
        pterodactylUserId: user.pterodactylUserId || null, 
        resources: user.resources 
      } 
    });
  } catch (e) {
    // Error logged silently for production
    await writeAudit(req, 'auth.login.error', 'auth', user?._id?.toString() || null, {
      reason: 'server_error',
      error: e.message,
      emailOrUsername: req.body.emailOrUsername,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const login2faSchema = z.object({ tempToken: z.string(), code: z.string().min(6).max(8) });

router.post('/login/2fa', loginRateLimit, async (req, res) => {

  let userId = null;
  
  try {
    const parsed = login2faSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    
    const { tempToken, code } = parsed.data;
    
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Session expired, please log in again' });
    }
    
    if (decoded.type !== '2fa') {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    
    userId = decoded.sub;
    const user = await User.findById(userId);
    if (!user || !user.tfaEnabled) {
      return res.status(401).json({ error: 'Invalid user or 2FA not enabled' });
    }
    
    let isValid = false;
    
    if (code.length === 6) {
      try { isValid = verifySync({ token: code, secret: user.tfaSecret })?.valid === true; } catch { isValid = false; }
    } 
    // Check if it's a backup code (8 characters hex)
    else if (code.length === 8 && user.tfaBackupCodes && user.tfaBackupCodes.includes(code)) {
      isValid = true;
      // Consume backup code
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
      return res.status(401).json({ error: code.length === 8 ? 'Invalid backup code' : 'Invalid 2FA code' });
    }
    
    // Complete login
    const { token, session } = await SessionService.createSessionAndJwt(user, req);
    req.user = user;
    
    // Log successful 2FA login
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
    
    // Send login alert email (non-blocking)
    try {
      const { sendMailTemplate } = require('../../lib/mail');
      await sendMailTemplate({
        to: user.email,
        templateKey: 'loginAlert',
        data: {
          ip: req.ip,
          userAgent: req.get('User-Agent') || '',
          time: new Date().toISOString(),
          username: user.username,
        }
      });
    } catch {}
    
    return res.json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        username: user.username, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        role: user.role, 
        coins: Number(user.coins || 0), 
        pterodactylUserId: user.pterodactylUserId || null, 
        resources: user.resources 
      } 
    });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Extract user info from JWT token if present
    let user = null;
    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(String(decoded.sub));
        
        // Revoke the current session
        if (decoded.sessionId) {
          const UserSession = require('../../models/UserSession');
          await UserSession.findByIdAndDelete(decoded.sessionId);
          req.sessionId = decoded.sessionId; // Store for audit log
        }
      } catch {
        // Invalid token during logout - logged silently
      }
      
      req.user = user;
    }
    
    // Log logout attempt
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
    // Error logged silently for production
    await writeAudit(req, 'auth.logout.error', 'auth', null, {
      reason: 'server_error',
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


