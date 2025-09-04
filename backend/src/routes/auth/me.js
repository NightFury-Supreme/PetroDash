const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const User = require('../../models/User');
const Server = require('../../models/Server');

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).lean();
    if (!user) return res.status(404).json({ error: 'Not found' });
    
    // Get user's server count
    const serverCount = await Server.countDocuments({ owner: user._id });
    
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
    });
  } catch (e) { 
    console.error('Auth me failed:', e);
    return res.status(500).json({ error: 'Internal server error' }); 
  }
});

module.exports = router;


