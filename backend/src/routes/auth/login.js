const express = require('express');
const { z } = require('zod');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { writeAudit } = require('../../middleware/audit');

const router = express.Router();

const loginSchema = z.object({ emailOrUsername: z.string().min(1), password: z.string().min(8) });

function generateJwt(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/login', async (req, res) => {
  const startTime = Date.now();
  let user = null;
  
  try {
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
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateJwt(user);
    
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
      durationMs: Date.now() - startTime
    });
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

// Logout route
router.post('/logout', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Extract user info from JWT token if present
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.sub);
      } catch (error) {
        // Invalid token, but we still want to log the logout attempt
        // Invalid token during logout - logged silently
      }
    }
    
    // Log logout attempt
    await writeAudit(req, 'auth.logout', 'auth', user?._id?.toString() || null, {
      userId: user?._id?.toString() || null,
      username: user?.username || null,
      email: user?.email || null,
      role: user?.role || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime
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


