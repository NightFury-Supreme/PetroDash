const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../../middleware/auth');
const User = require('../../models/User');
const Server = require('../../models/Server');
const {
  updatePanelUser,
  deleteServer: deletePanelServer,
  deletePanelUser,
  checkUserExists
} = require('../../services/pterodactyl');

const router = express.Router();

const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional()
});

router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const { username, firstName, lastName } = parsed.data;
    if (typeof username === 'string' && username !== user.username) {
      const exists = await User.findOne({ username }).lean();
      if (exists) return res.status(409).json({ error: 'Username already in use' });

      // Check Pterodactyl panel for existing username
      const pterodactylCheck = await checkUserExists(user.email, username);
      if (pterodactylCheck.usernameExists)
        return res.status(409).json({ error: 'Username already exists in Pterodactyl panel' });

      user.username = username;
    }
    if (typeof firstName === 'string') user.firstName = firstName;
    if (typeof lastName === 'string') user.lastName = lastName;
    await user.save();
    try {
      if (user.pterodactylUserId)
        await updatePanelUser(user.pterodactylUserId, {
          email: user.email,
          username: user.username,
          first_name: user.firstName,
          last_name: user.lastName
        });
    } catch (_) {}
    return res.json({
      id: user._id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      coins: Number(user.coins || 0),
      pterodactylUserId: user.pterodactylUserId || null,
      resources: user.resources
    });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Not found' });

    const servers = await Server.find({ owner: user._id });
    let deletedServers = 0;
    let serverErrors = [];

    // Step 1: Delete all servers
    for (const server of servers) {
      try {
        await deletePanelServer(server.panelServerId);
        await Server.deleteOne({ _id: server._id });
        deletedServers++;
      } catch (error) {
        serverErrors.push({ serverId: server._id, serverName: server.name, error: error.message });
        // Server deletion error logged silently
      }
    }

    // Step 2: Delete Pterodactyl user account
    let pterodactylError = null;
    if (user.pterodactylUserId) {
      try {
        await deletePanelUser(user.pterodactylUserId);
      } catch (error) {
        pterodactylError = error.message;
        // Pterodactyl user deletion error logged silently
      }
    }

    // Step 3: Delete dashboard user
    await User.deleteOne({ _id: user._id });

    // Return success with any errors that occurred
    return res.json({
      ok: true,
      serversDeleted: deletedServers,
      totalServers: servers.length,
      serverErrors,
      pterodactylError,
      message:
        serverErrors.length > 0 || pterodactylError
          ? 'Account deleted but some cleanup operations failed. Check server logs for details.'
          : 'Account and all associated data deleted successfully.'
    });
  } catch (error) {
    // Account deletion error logged silently
    return res.status(500).json({ error: 'Failed to delete account', details: error.message });
  }
});

module.exports = router;

// Extra routes for email and password update

const updateEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.patch('/profile/email', requireAuth, async (req, res) => {
  try {
    const parsed = updateEmailSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const { email, password } = parsed.data;
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const exists = await User.findOne({ email }).lean();
    if (exists && String(exists._id) !== String(user._id))
      return res.status(409).json({ error: 'Email already in use' });
    user.email = email;
    await user.save();
    try {
      if (user.pterodactylUserId)
        await updatePanelUser(user.pterodactylUserId, {
          email: user.email,
          username: user.username,
          first_name: user.firstName,
          last_name: user.lastName
        });
    } catch (_) {}
    return res.json({ ok: true, email: user.email });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z
    .string()
    .min(8)
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Password must contain letters and numbers')
});

router.patch('/profile/password', requireAuth, async (req, res) => {
  try {
    const parsed = updatePasswordSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const { currentPassword, newPassword } = parsed.data;
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});
