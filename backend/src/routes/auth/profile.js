const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../../middleware/auth');
const User = require('../../models/User');
const UserSession = require('../../models/UserSession');
const Server = require('../../models/Server');
const { updatePanelUser, deleteServer: deletePanelServer, deletePanelUser, checkUserExists } = require('../../services/pterodactyl');
const { deleteCache } = require('../../lib/redis');
const { generateSecret, generateURI, verifySync } = require('otplib');
const qrcode = require('qrcode');
const crypto = require('crypto');
const { logUserActivity } = require('../../middleware/userActivity');
const PendingUpdate = require('../../models/PendingUpdate');

const router = express.Router();

const updateProfileSchema = z.object({ username: z.string().min(3).max(30).optional(), firstName: z.string().min(1).optional(), lastName: z.string().min(1).optional() });

router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const { username, firstName, lastName } = parsed.data;

    const oldValues = {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName
    };
    if (typeof username === 'string' && username !== user.username) {
      const exists = await User.findOne({ username }).lean();
      if (exists) return res.status(409).json({ error: 'Username already in use' });
      
      // Check Pterodactyl panel for existing username
      const pterodactylCheck = await checkUserExists(user.email, username, user.pterodactylUserId);
      if (pterodactylCheck.usernameExists) return res.status(409).json({ error: 'Username already exists in Pterodactyl panel' });
      
      user.username = username;
    }
    if (typeof firstName === 'string') user.firstName = firstName;
    if (typeof lastName === 'string') user.lastName = lastName;
    await user.save();

    if (user.pterodactylUserId) {
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
    
    const changes = {};
    if (oldValues.username !== user.username) changes.username = `${oldValues.username || 'None'} to ${user.username || 'None'}`;
    if (oldValues.firstName !== user.firstName) changes.firstName = `${oldValues.firstName || 'None'} to ${user.firstName || 'None'}`;
    if (oldValues.lastName !== user.lastName) changes.lastName = `${oldValues.lastName || 'None'} to ${user.lastName || 'None'}`;
    
    if (Object.keys(changes).length > 0) {
      await logUserActivity(req, 'auth.account.update', changes);
    }
    
    return res.json({ id: user._id, email: user.email, username: user.username, firstName: user.firstName, lastName: user.lastName, role: user.role, coins: Number(user.coins || 0), pterodactylUserId: user.pterodactylUserId || null, resources: user.resources });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) { return res.status(500).json({ error: 'Internal server error' }); }
});

// Real-time username availability check
router.get('/check-username', requireAuth, async (req, res) => {
  try {
    const username = String(req.query.username || '').trim();
    if (!username || username.length < 3 || username.length > 30 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.json({ available: false });
    }
    const existing = await User.findOne({ username }).lean();
    // Not taken, or it belongs to the requesting user (same name, no change needed)
    const localAvailable = !existing || String(existing._id) === String(req.user.sub);
    
    if (!localAvailable) return res.json({ available: false });

    // Ensure it's not taken by another user in Pterodactyl
    const user = await User.findById(req.user.sub);
    const pterodactylCheck = await checkUserExists(null, username, user ? user.pterodactylUserId : null);
    
    return res.json({ available: !pterodactylCheck.usernameExists });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) { return res.status(500).json({ error: 'Internal server error' }); }
});

const deleteProfileSchema = z.object({
  password: z.string().min(6).optional(),
  tfaCode: z.string().min(6).max(8).optional()
});

router.delete('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Not found' });
    
    const parsed = deleteProfileSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const { password, tfaCode } = parsed.data;

    // Only require password if the user actually has one (e.g. not Discord-only)
    if (user.passwordHash) {
      if (!password) return res.status(401).json({ error: 'Password required' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Invalid password' });
    }
    
    if (user.tfaEnabled) {
      if (!tfaCode) return res.status(401).json({ error: '2FA code required' });
      let isValid = false;
      if (tfaCode.length === 6) {
        try { isValid = verifySync({ token: tfaCode, secret: user.tfaSecret })?.valid === true; } catch {}
      } else if (tfaCode.length === 8 && user.tfaBackupCodes && user.tfaBackupCodes.includes(tfaCode)) {
        isValid = true;
        user.tfaBackupCodes = user.tfaBackupCodes.filter(c => c !== tfaCode);
      }
      if (!isValid) return res.status(401).json({ error: tfaCode.length === 8 ? 'Invalid backup code' : 'Invalid 2FA code' });
    }
    
    const servers = await Server.find({ owner: user._id });
    
    const PendingDeletion = require('../../models/PendingDeletion');
    
    // Step 1: Delete all servers
    for (const server of servers) {
      try {
        await deletePanelServer(server.panelServerId);
      } catch {
        await PendingDeletion.create({ resourceType: 'server', panelId: server.panelServerId });
        // Server deletion error logged silently
      }
      // Always delete local server record regardless of panel success
      await Server.deleteOne({ _id: server._id });
    }
    
    // Step 2: Delete Pterodactyl user account
    if (user.pterodactylUserId) {
      try {
        await deletePanelUser(user.pterodactylUserId);
      } catch {
        await PendingDeletion.create({ resourceType: 'user', panelId: user.pterodactylUserId });
        // Pterodactyl user deletion error logged silently
      }
    }
    
    // Step 3: Delete dashboard user
    await User.deleteOne({ _id: user._id });
    
    await logUserActivity(req, 'auth.account.delete');

    // Return success since the pending deletions are queued in the background
    return res.json({ 
      ok: true, 
      message: 'Account and all associated data deleted successfully.'
    });
  } catch (error) {
    // Account deletion error logged silently
    return res.status(500).json({ error: 'Failed to delete account', details: error.message });
  }
});

router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const sessions = await UserSession.find({ userId: req.user.sub })
      .sort({ lastActive: -1 })
      .lean();
    
    return res.json(sessions.map(s => ({
      id: s._id,
      device: s.device,
      deviceType: s.deviceType,
      browser: s.browser,
      ip: s.ip,
      lastActive: s.lastActive,
      current: req.user.sessionId === s._id.toString()
    })));
  } catch (e) {
    console.error('Error fetching sessions:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/sessions/:id', requireAuth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Prevent deleting current session through this route
    if (req.user.sessionId === sessionId) {
      return res.status(400).json({ error: 'Cannot revoke your current session' });
    }
    
    const session = await UserSession.findOneAndDelete({ _id: sessionId, userId: req.user.sub });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Invalidate the cache
    await deleteCache(`session:valid:${sessionId}`);
    
    await logUserActivity(req, 'auth.session.revoke', { revokedSessionId: sessionId });
    
    return res.json({ success: true });
  } catch (e) {
    console.error('Error deleting session:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Extra routes for email and password update

// 2FA Routes

router.post('/2fa/setup', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.tfaEnabled) return res.status(400).json({ error: '2FA is already enabled' });

    const secret = generateSecret();
    user.tfaSecret = secret;
    await user.save();

    const otpauth = generateURI({ label: user.email, issuer: 'PteroDash', secret });
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    return res.json({ secret, qrCodeUrl });
  } catch (e) {
    console.error('2FA setup error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const enableTfaSchema = z.object({ code: z.string().length(6) });
router.post('/2fa/enable', requireAuth, async (req, res) => {
  try {
    const parsed = enableTfaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });

    const user = await User.findById(req.user.sub);
    if (!user || !user.tfaSecret) return res.status(400).json({ error: '2FA not set up' });
    if (user.tfaEnabled) return res.status(400).json({ error: '2FA is already enabled' });

    let isValid = false;
    try { isValid = verifySync({ token: parsed.data.code, secret: user.tfaSecret })?.valid === true; } catch {}
    if (!isValid) return res.status(400).json({ error: 'Invalid verification code' });

    // Generate 10 backup codes
    const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));
    
    user.tfaEnabled = true;
    user.tfaBackupCodes = backupCodes; // In production, these should be hashed, but for simplicity here we store them as-is
    await user.save();

    const { sendMailTemplate } = require('../../lib/mail');
    const { getSettings } = require('../../lib/settings');
    await sendMailTemplate({
      to: user.email,
      templateKey: 'twoFactorEnabled',
      data: { username: user.username, siteName: (await getSettings())?.siteName || 'PteroDash' }
    }).catch(e => console.error('Failed to send 2FA enabled email:', e));

    await logUserActivity(req, 'auth.2fa.enable');
    return res.json({ success: true, backupCodes });
  } catch (e) {
    console.error('2FA enable error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const disableTfaSchema = z.object({ password: z.string(), code: z.string().length(6) });
router.post('/2fa/disable', requireAuth, async (req, res) => {
  try {
    const parsed = disableTfaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });

    const user = await User.findById(req.user.sub);
    if (!user || !user.tfaEnabled) return res.status(400).json({ error: '2FA is not enabled' });

    // Verify password
    const passwordOk = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!passwordOk) return res.status(401).json({ error: 'Invalid password' });

    // Verify code
    let isValid = false;
    try { isValid = verifySync({ token: parsed.data.code, secret: user.tfaSecret })?.valid === true; } catch {}
    if (!isValid) return res.status(400).json({ error: 'Invalid verification code' });

    user.tfaEnabled = false;
    user.tfaSecret = null;
    user.tfaBackupCodes = [];
    await user.save();

    const { sendMailTemplate } = require('../../lib/mail');
    const { getSettings } = require('../../lib/settings');
    await sendMailTemplate({
      to: user.email,
      templateKey: 'twoFactorDisabled',
      data: { username: user.username, siteName: (await getSettings())?.siteName || 'PteroDash' }
    }).catch(e => console.error('Failed to send 2FA disabled email:', e));

    await logUserActivity(req, 'auth.2fa.disable');
    return res.json({ success: true });
  } catch (e) {
    console.error('2FA disable error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


const updateEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tfaCode: z.string().min(6).max(8).optional()
});

router.patch('/profile/email', requireAuth, async (req, res) => {
  try {
    const parsed = updateEmailSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const { email, password, tfaCode } = parsed.data;
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    
    if (user.tfaEnabled) {
      if (!tfaCode) return res.status(401).json({ error: '2FA code required' });
      let isValid = false;
      if (tfaCode.length === 6) {
        try { isValid = verifySync({ token: tfaCode, secret: user.tfaSecret })?.valid === true; } catch {}
      } else if (tfaCode.length === 8 && user.tfaBackupCodes && user.tfaBackupCodes.includes(tfaCode)) {
        isValid = true;
        user.tfaBackupCodes = user.tfaBackupCodes.filter(c => c !== tfaCode);
      }
      if (!isValid) return res.status(401).json({ error: tfaCode.length === 8 ? 'Invalid backup code' : 'Invalid 2FA code' });
    }
    
    const exists = await User.findOne({ email }).lean();
    if (exists && String(exists._id) !== String(user._id)) return res.status(409).json({ error: 'Email already in use' });
    
    const { getSettings } = require('../../lib/settings');
    const s = await getSettings();
    const emailVerificationEnabled = s?.auth?.emailVerification ?? false;

    if (emailVerificationEnabled) {
      // Send verification code, do not update user email yet
      try {
        const { generateSecureCode, hashString } = require('../../utils/security');
        const VerificationToken = require('../../models/VerificationToken');
        const { sendMailTemplate } = require('../../lib/mail');
        
        const verificationCode = generateSecureCode(8);
        const tokenHash = hashString(verificationCode);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 15);
        
        await VerificationToken.deleteMany({ userId: user._id, purpose: 'email_change', usedAt: null });
        await VerificationToken.create({ 
          userId: user._id, 
          tokenHash, 
          purpose: 'email_change', 
          newEmail: email,
          expiresAt,
          attempts: 0,
          maxAttempts: 5 
        });
        
        await sendMailTemplate({
          to: email, // Send to the NEW email address
          templateKey: 'accountCreateWithVerification',
          data: { username: user.username, verificationCode, siteName: s?.siteName || 'PteroDash' },
        });
        
        return res.json({ ok: true, requiresVerification: true, message: 'Verification code sent to new email' });
      } catch {
        console.error('Failed to send verification email for email change:', e);
        return res.status(500).json({ error: 'Failed to send verification email' });
      }
    } else {
      // Email verification disabled, update immediately
      const oldEmail = user.email;
      user.email = email;
      await user.save();
      
      const { sendMailTemplate } = require('../../lib/mail');
      await sendMailTemplate({
        to: oldEmail,
        templateKey: 'emailChanged',
        data: { username: user.username, newEmail: user.email, siteName: s?.siteName || 'PteroDash' }
      }).catch(e => console.error('Failed to send emailChanged email:', e));
      
      if (user.pterodactylUserId) {
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
      
      await logUserActivity(req, 'auth.email.update', { email });
      return res.json({ ok: true, email: user.email });
    }
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const verifyEmailChangeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(8)
});

router.post('/profile/email/verify', requireAuth, async (req, res) => {
  try {
    const parsed = verifyEmailChangeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    
    const { email, code } = parsed.data;
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Not found' });
    
    const VerificationToken = require('../../models/VerificationToken');
    const tokenRecord = await VerificationToken.findOne({
      userId: user._id,
      purpose: 'email_change',
      newEmail: email,
      usedAt: null
    }).sort({ createdAt: -1 });
    
    if (!tokenRecord) {
      return res.status(400).json({ error: 'Verification session expired or not found' });
    }
    
    if (tokenRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification code expired' });
    }
    
    if (tokenRecord.lockedUntil && tokenRecord.lockedUntil > new Date()) {
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }
    
    const { hashString } = require('../../utils/security');
    const inputHash = hashString(code);
    
    if (inputHash !== tokenRecord.tokenHash) {
      tokenRecord.attempts += 1;
      if (tokenRecord.attempts >= tokenRecord.maxAttempts) {
        tokenRecord.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }
      await tokenRecord.save();
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Check if another user took the email while we were waiting
    const exists = await User.findOne({ email }).lean();
    if (exists && String(exists._id) !== String(user._id)) {
      return res.status(409).json({ error: 'Email already in use by another account' });
    }
    
    tokenRecord.usedAt = new Date();
    await tokenRecord.save();
    
    const oldEmail = user.email;
    user.email = email;
    user.emailVerified = true;
    await user.save();
    
    const { sendMailTemplate } = require('../../lib/mail');
    const { getSettings } = require('../../lib/settings');
    await sendMailTemplate({
      to: oldEmail,
      templateKey: 'emailChanged',
      data: { username: user.username, newEmail: user.email, siteName: (await getSettings())?.siteName || 'PteroDash' }
    }).catch(e => console.error('Failed to send emailChanged email:', e));
    
    if (user.pterodactylUserId) {
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
    
    await logUserActivity(req, 'auth.email.update', { email });
    return res.json({ ok: true, email: user.email });
  } catch (e) {
    console.error('Error verifying email change:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Password must contain letters and numbers'),
  tfaCode: z.string().min(6).max(8).optional()
});

router.patch('/profile/password', requireAuth, async (req, res) => {
  try {
    const parsed = updatePasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const { currentPassword, newPassword, tfaCode } = parsed.data;
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    
    if (user.tfaEnabled) {
      if (!tfaCode) return res.status(401).json({ error: '2FA code required' });
      let isValid = false;
      if (tfaCode.length === 6) {
        try { isValid = verifySync({ token: tfaCode, secret: user.tfaSecret })?.valid === true; } catch {}
      } else if (tfaCode.length === 8 && user.tfaBackupCodes && user.tfaBackupCodes.includes(tfaCode)) {
        isValid = true;
        user.tfaBackupCodes = user.tfaBackupCodes.filter(c => c !== tfaCode);
      }
      if (!isValid) return res.status(401).json({ error: tfaCode.length === 8 ? 'Invalid backup code' : 'Invalid 2FA code' });
    }
    

    
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    const { sendMailTemplate } = require('../../lib/mail');
    const { getSettings } = require('../../lib/settings');
    await sendMailTemplate({
      to: user.email,
      templateKey: 'passwordChanged',
      data: { username: user.username, siteName: (await getSettings())?.siteName || 'PteroDash' }
    }).catch(e => console.error('Failed to send passwordChanged email:', e));
    
    await logUserActivity(req, 'auth.password.update');
    return res.json({ ok: true });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


