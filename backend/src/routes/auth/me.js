const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const User = require('../../models/User');
const Server = require('../../models/Server');

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).lean();
    if (!user) return res.status(404).json({ error: 'Not found' });
    // If banned, short-circuit with 403 for guard to redirect
    const ban = user.ban || {};
    const activeBan = Boolean(ban.isBanned) && (!ban.until || new Date(ban.until) > new Date());
    if (activeBan) {
      return res.status(403).json({ error: 'Account banned', reason: ban.reason || '', until: ban.until || null });
    }
    
    // Get user's server count
    const serverCount = await Server.countDocuments({ owner: user._id });
    
    // Determine login method
    const loginMethod = user.passwordHash ? 'email' : 
                       user.oauthProviders?.discord?.id ? 'discord' : 
                       user.oauthProviders?.google?.id ? 'google' : 'email';
    
    return res.json({ 
      id: user._id, 
      email: user.email, 
      username: user.username, 
      firstName: user.firstName, 
      lastName: user.lastName, 
      role: user.role, 
      coins: Number(user.coins || 0), 
      pterodactylUserId: user.pterodactylUserId || null, 
      resources: user.resources,
      serverCount: Number(serverCount || 0),
      loginMethod: loginMethod,
      oauthProviders: user.oauthProviders || {},
      emailVerified: Boolean(user.emailVerified)
    });
  } catch (e) { 
    // Error logged silently for production
    return res.status(500).json({ error: 'Internal server error' }); 
  }
});

module.exports = router;


