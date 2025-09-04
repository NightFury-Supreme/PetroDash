const express = require('express');
const { z } = require('zod');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const loginSchema = z.object({ emailOrUsername: z.string().min(1), password: z.string().min(8) });

function generateJwt(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const { emailOrUsername, password } = parsed.data;
    const user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = generateJwt(user);
    try { const { writeAudit } = require('../../middleware/audit'); await writeAudit(req, 'auth.login', 'auth', user._id.toString()); } catch (_) {}
    return res.json({ token, user: { id: user._id, email: user.email, username: user.username, firstName: user.firstName, lastName: user.lastName, role: user.role, coins: Number(user.coins || 0), pterodactylUserId: user.pterodactylUserId || null, resources: user.resources } });
  } catch (e) { return res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;


