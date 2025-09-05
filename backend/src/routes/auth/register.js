const express = require('express');
const { z } = require('zod');
const UserCreationService = require('../../services/userCreation');
const { writeAudit } = require('../../middleware/audit');

const router = express.Router();

const strongPassword = z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/);
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: strongPassword,
  ref: z.string().trim().optional(),
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
    console.error('Registration error:', error);
    
    // Log registration failure
    await writeAudit(req, 'auth.register.failed', 'auth', user?._id?.toString() || null, {
      reason: error.message.includes('already in use') || error.message.includes('already exists') ? 'user_exists' : 'server_error',
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


