const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const User = require('../../models/User');
const DefaultResources = require('../../models/DefaultResources');
const { createPanelUser, checkUserExists } = require('../../services/pterodactyl');
const jwt = require('jsonwebtoken');

const router = express.Router();

const strongPassword = z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/);
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: strongPassword,
});

function generateJwt(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const { email, username, firstName, lastName, password } = parsed.data;

    const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (existing) return res.status(409).json({ error: 'Email or username already in use' });

    // Check Pterodactyl panel for existing users
    const pterodactylCheck = await checkUserExists(email, username);
    if (pterodactylCheck.emailExists) return res.status(409).json({ error: 'Email already exists in Pterodactyl panel' });
    if (pterodactylCheck.usernameExists) return res.status(409).json({ error: 'Username already exists in Pterodactyl panel' });

    const passwordHash = await bcrypt.hash(password, 12);
    const defaults = await DefaultResources.findOne({}).lean();
    const user = await User.create({
      email, username, firstName, lastName, passwordHash,
      coins: Number(defaults?.coins || 0),
      resources: {
        diskMb: Number(defaults?.diskMb ?? 5120),
        memoryMb: Number(defaults?.memoryMb ?? 2048),
        cpuPercent: Number(defaults?.cpuPercent ?? 80),
        backups: Number(defaults?.backups ?? 0),
        databases: Number(defaults?.databases ?? 0),
        allocations: Number(defaults?.allocations ?? 0),
        serverSlots: Number(defaults?.serverSlots ?? 1),
      },
    });

    try {
      const panelUser = await createPanelUser({ email, username, firstName, lastName, password });
      if (panelUser?.id) { user.pterodactylUserId = panelUser.id; await user.save(); }
    } catch (_) {}

    const token = generateJwt(user);
    return res.status(201).json({ token, user: { id: user._id, email: user.email, username: user.username, firstName: user.firstName, lastName: user.lastName, role: user.role, coins: Number(user.coins || 0), pterodactylUserId: user.pterodactylUserId || null, resources: user.resources } });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


