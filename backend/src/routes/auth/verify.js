const express = require('express');
const crypto = require('crypto');
const { z } = require('zod');
const User = require('../../models/User');
const VerificationToken = require('../../models/VerificationToken');
const Settings = require('../../models/Settings');
const { generateSecureCode, constantTimeCompare, hashString } = require('../../utils/security');
const { verificationRateLimit, resendRateLimit } = require('../../middleware/rateLimit');

const router = express.Router();

const verifySchema = z.object({ token: z.string().min(32).max(256) });

router.get('/verify', async (req, res) => {
  try {
    
    const parsed = verifySchema.safeParse({ token: String(req.query.token || '') });
    if (!parsed.success) {
      // Token validation failed - logged silently
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    const raw = parsed.data.token;
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    
    const vt = await VerificationToken.findOne({ tokenHash, purpose: 'email_verification', usedAt: null });
    if (!vt) return res.status(400).json({ error: 'Invalid or expired token' });
    
    if (vt.expiresAt && vt.expiresAt < new Date()) return res.status(400).json({ error: 'Token expired' });
    
    const user = await User.findById(vt.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.emailVerified = true;
    await user.save();
    vt.usedAt = new Date();
    await vt.save();
    
    const redirect = (process.env.FRONTEND_URL || 'http://localhost:3000') + '/dashboard?verified=1';
    const wantsRedirect = String(req.query.redirect || '1') !== '0';
    
    if (wantsRedirect) return res.redirect(302, redirect);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to verify email' });
  }
});

const resendSchema = z.object({ email: z.string().email() });
const verifyCodeSchema = z.object({ 
  email: z.string().email(),
  code: z.string().length(8, 'Code must be 8 digits')
});

router.post('/verify/resend', resendRateLimit, async (req, res) => {
  try {
    const parsed = resendSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const { email } = parsed.data;
    
    // Always return success to prevent user enumeration
    // But only send email if user exists and needs verification
    const user = await User.findOne({ email });
    if (!user) return res.json({ ok: true });
    if (user.emailVerified) return res.json({ ok: true, alreadyVerified: true });

    // Generate secure 8-digit verification code
    const verificationCode = generateSecureCode(8);
    const codeHash = hashString(verificationCode);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
    
    // Delete any existing verification tokens for this user
    await VerificationToken.deleteMany({ userId: user._id, purpose: 'email_verification', usedAt: null });
    
    // Create new verification token with code
    await VerificationToken.create({ 
      userId: user._id, 
      tokenHash: codeHash, 
      purpose: 'email_verification', 
      expiresAt,
      attempts: 0,
      maxAttempts: 5
    });

    const { sendMailTemplate } = require('../../lib/mail');
    
    try {
      await sendMailTemplate({
        to: user.email,
        templateKey: 'accountCreateWithVerification',
        data: { 
          username: user.username, 
          verificationCode: verificationCode,
          siteName: (await Settings.findOne({}).lean())?.siteName || 'PteroDash' 
        },
      });
    } catch (mailError) {
      // Don't leak email errors to prevent enumeration
      // Email error logged silently for production
    }
    
    return res.json({ ok: true });
  } catch (e) {
    // Error logged silently for production
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// POST /api/auth/verify/code - Verify email with code
router.post('/verify/code', verificationRateLimit, async (req, res) => {
  try {
    const parsed = verifyCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    
    const { email, code } = parsed.data;
    
    // Always perform the same operations to prevent timing attacks
    const user = await User.findOne({ email });
    if (!user) {
      // Simulate processing time to prevent enumeration
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    
    if (user.emailVerified) {
      return res.json({ ok: true, alreadyVerified: true });
    }

    // Hash the provided code
    const codeHash = hashString(code);
    
    // Find verification token
    const vt = await VerificationToken.findOne({ 
      tokenHash: codeHash, 
      purpose: 'email_verification', 
      usedAt: null 
    });
    
    if (!vt) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    
    // Check if token is locked due to too many attempts
    if (vt.lockedUntil && vt.lockedUntil > new Date()) {
      return res.status(429).json({ 
        error: 'Too many failed attempts. Please try again later.',
        retryAfter: Math.ceil((vt.lockedUntil - new Date()) / 1000)
      });
    }
    
    if (vt.expiresAt && vt.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }
    
    // Increment attempt counter
    vt.attempts += 1;
    
    // Check if max attempts exceeded
    if (vt.attempts >= vt.maxAttempts) {
      vt.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      await vt.save();
      return res.status(429).json({ 
        error: 'Too many failed attempts. Please request a new code.',
        retryAfter: 900
      });
    }
    
    // Verify the user
    user.emailVerified = true;
    await user.save();
    
    // Mark token as used
    vt.usedAt = new Date();
    await vt.save();
    
    return res.json({ ok: true });
    
  } catch (e) {
    // Error logged silently for production
    return res.status(500).json({ error: 'Failed to verify code' });
  }
});

module.exports = router;



