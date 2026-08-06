const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const User = require('../../models/User');
const Server = require('../../models/Server');
const Settings = require('../../models/Settings');

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
    
    // Get profile picture based on login method
    let profilePicture = '';
    if (user.oauthProviders?.discord?.id && user.oauthProviders.discord.avatar) {
      // Discord avatar URL format
      const discordId = user.oauthProviders.discord.id;
      const avatarHash = user.oauthProviders.discord.avatar;
      profilePicture = `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png`;
    } else if (user.oauthProviders?.google?.picture) {
      // Google profile picture
      profilePicture = user.oauthProviders.google.picture;
    } else if (user.profilePicture) {
      // Email user with uploaded profile picture
      profilePicture = user.profilePicture;
    }

    let emailVerification = true;
    try {
      const s = await Settings.findOne({}).lean();
      emailVerification = s?.auth?.emailVerification ?? true;
    // eslint-disable-next-line unused-imports/no-unused-vars
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
      resources: user.resources,
      serverCount: Number(serverCount || 0),
      loginMethod: loginMethod,
      profilePicture: profilePicture,
      oauthProviders: user.oauthProviders || {},
      emailVerified: Boolean(user.emailVerified),
      emailVerification: Boolean(emailVerification)
    });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) { 
    // Error logged silently for production
    return res.status(500).json({ error: 'Internal server error' }); 
  }
});

// Update profile picture (email users only)
router.patch('/me/profile-picture', requireAuth, async (req, res) => {
  try {
    const { profilePicture } = req.body;
    
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Check if user is an OAuth user (can't update profile picture manually)
    if (user.oauthProviders?.discord?.id || user.oauthProviders?.google?.id) {
      return res.status(400).json({ 
        error: 'OAuth users cannot manually set profile picture',
        message: 'Your profile picture is managed by your OAuth provider (Discord/Google)'
      });
    }
    
    // Validate URL format if provided
    if (profilePicture && profilePicture.trim()) {
      // Use URL constructor for safe validation (no ReDoS)
      try {
        const url = new URL(profilePicture.trim());
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return res.status(400).json({ error: 'Invalid URL format. Must start with http:// or https://' });
        }
        
        // Validate image extension - use simple string check
        const pathname = url.pathname.toLowerCase();
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const hasValidExtension = validExtensions.some(ext => pathname.endsWith(ext));
        
        if (!hasValidExtension) {
          return res.status(400).json({ 
            error: 'Invalid image URL. Must end with .jpg, .jpeg, .png, .gif, .webp, or .svg' 
          });
        }
        
        user.profilePicture = profilePicture.trim();
      // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (e) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
    } else {
      // Empty string to remove profile picture
      user.profilePicture = '';
    }
    
    await user.save();
    
    return res.json({ 
      message: 'Profile picture updated successfully',
      profilePicture: user.profilePicture
    });
  } catch (e) {
    console.error('Profile picture update error:', e);
    return res.status(500).json({ error: 'Failed to update profile picture' });
  }
});

module.exports = router;


