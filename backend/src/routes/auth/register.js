const express = require('express');
const { z } = require('zod');
const UserCreationService = require('../../services/userCreation');
const { writeAudit } = require('../../middleware/audit');

const router = express.Router();

const strongPassword = z
  .string()
  .min(8)
  .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/);
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: strongPassword,
  ref: z.string().trim().optional()
});

router.post('/register', async (req, res) => {
  const startTime = Date.now();
  let user = null;

  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      await writeAudit(req, 'auth.register.failed', 'auth', null, {
        reason: 'invalid_payload',
        details: parsed.error.flatten(),
        email: req.body.email,
        username: req.body.username,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(400).json({
        error: 'Invalid payload',
        details: parsed.error.flatten()
      });
    }

    const { email, username, firstName, lastName, password, ref } = parsed.data;

    // Use unified user creation service
    user = await UserCreationService.createUser({
      email,
      username,
      firstName,
      lastName,
      password,
      ref
    });

    const token = UserCreationService.generateJwt(user);
    const userResponse = UserCreationService.formatUserResponse(user);

    // After creation, send verification email if email login
    try {
      const crypto = require('crypto');
      const VerificationToken = require('../../models/VerificationToken');
      const Settings = require('../../models/Settings');
      const { sendMailTemplate } = require('../../lib/mail');
      const raw = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
      await VerificationToken.deleteMany({
        userId: user._id,
        purpose: 'email_verification',
        usedAt: null
      });
      await VerificationToken.create({
        userId: user._id,
        tokenHash,
        purpose: 'email_verification',
        expiresAt
      });
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${encodeURIComponent(raw)}`;
      const s = await Settings.findOne({}).lean();
      await sendMailTemplate({
        to: user.email,
        templateKey: 'accountCreateWithVerification',
        data: {
          username: user.username,
          verificationLink: verifyUrl,
          siteName: s?.siteName || 'PteroDash'
        }
      });
    } catch (_) {}

    // Log successful registration
    await writeAudit(req, 'auth.register.success', 'auth', user._id.toString(), {
      registrationMethod: 'email',
      email,
      username,
      firstName,
      lastName,
      userId: user._id.toString(),
      role: user.role,
      referralCode: ref || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime
    });

    return res.status(201).json({ token, user: userResponse });
  } catch (error) {
    // Error logged silently for production

    // Log registration failure
    await writeAudit(req, 'auth.register.failed', 'auth', user?._id?.toString() || null, {
      reason:
        error.message.includes('already in use') || error.message.includes('already exists')
          ? 'user_exists'
          : 'server_error',
      error: error.message,
      email: req.body.email,
      username: req.body.username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime
    });

    if (error.message.includes('already in use') || error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
