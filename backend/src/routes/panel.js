const express = require('express');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const { getPanelUser, resetPanelUserPassword, updatePanelUser } = require('../services/pterodactyl');
const { z } = require('zod');

const router = express.Router();

// Rate limiting for password reset
const resetAttempts = new Map();

// GET /api/panel - Get panel info for logged-in user
router.get('/', requireAuth, async (req, res) => {
  try {
    // Validate user exists and is active
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.pterodactylUserId) {
      return res.status(400).json({ 
        error: 'Panel access not available',
        details: 'Your account is not linked to the control panel. Please contact support.'
      });
    }

    // Fetch panel user info
    const panelUser = await getPanelUser(user.pterodactylUserId);
    if (!panelUser) {
      return res.status(404).json({ 
        error: 'Panel user not found',
        details: 'Your panel account could not be located. Please contact support.'
      });
    }

    // Construct panel URLs
    const panelUrl = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
    if (!panelUrl) {
      return res.status(500).json({ 
        error: 'Panel configuration error',
        details: 'Panel URL is not configured properly.'
      });
    }

    return res.json({
      email: panelUser.email || user.email,
      username: panelUser.username || user.username,
      panelUrl,
      loginUrl: `${panelUrl}/auth/login`,
    });
  } catch (error) {
    console.error('Panel info fetch error:', error);
    
    // Handle specific Pterodactyl API errors
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Panel user not found',
        details: 'Your panel account could not be located. Please contact support.'
      });
    }
    
    if (error.response?.status === 403) {
      return res.status(403).json({ 
        error: 'Panel access denied',
        details: 'You do not have permission to access the panel.'
      });
    }

    return res.status(500).json({ 
      error: 'Failed to fetch panel information',
      details: 'An unexpected error occurred while loading panel data.'
    });
  }
});

// POST /api/panel/reset-password - Reset panel password
router.post('/reset-password', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    
    // Rate limiting check
    const now = Date.now();
    const userAttempts = resetAttempts.get(userId) || [];
    const recentAttempts = userAttempts.filter(time => now - time < 5 * 60 * 1000); // 5 minutes
    
    if (recentAttempts.length >= 3) {
      return res.status(429).json({ 
        error: 'Too many password reset attempts',
        details: 'Please wait 5 minutes before trying again.'
      });
    }

    // Validate user exists and is active
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.pterodactylUserId) {
      return res.status(400).json({ 
        error: 'Panel access not available',
        details: 'Your account is not linked to the control panel.'
      });
    }

    // Fetch existing panel user to preserve required fields
    const panelUser = await getPanelUser(user.pterodactylUserId);
    if (!panelUser) {
      return res.status(404).json({ 
        error: 'Panel user not found',
        details: 'Your panel account could not be located.'
      });
    }

    // Generate secure random password
    const generatePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const newPassword = generatePassword();

    // Update panel user with new password
    await updatePanelUser(user.pterodactylUserId, {
      email: panelUser.email,
      username: panelUser.username,
      first_name: panelUser.first_name || '',
      last_name: panelUser.last_name || '',
      password: newPassword,
    });

    // Update rate limiting
    userAttempts.push(now);
    resetAttempts.set(userId, userAttempts);

    // Clean up old attempts (older than 5 minutes)
    setTimeout(() => {
      const currentAttempts = resetAttempts.get(userId) || [];
      const validAttempts = currentAttempts.filter(time => Date.now() - time < 5 * 60 * 1000);
      if (validAttempts.length === 0) {
        resetAttempts.delete(userId);
      } else {
        resetAttempts.set(userId, validAttempts);
      }
    }, 5 * 60 * 1000);

    return res.json({ 
      password: newPassword,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Panel password reset error:', error);
    
    // Handle specific Pterodactyl API errors
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Panel user not found',
        details: 'Your panel account could not be located.'
      });
    }
    
    if (error.response?.status === 403) {
      return res.status(403).json({ 
        error: 'Panel access denied',
        details: 'You do not have permission to reset the panel password.'
      });
    }

    if (error.response?.status === 422) {
      return res.status(422).json({ 
        error: 'Invalid password format',
        details: 'The generated password does not meet panel requirements.'
      });
    }

    return res.status(500).json({ 
      error: 'Failed to reset panel password',
      details: 'An unexpected error occurred while resetting your password.'
    });
  }
});

module.exports = router;


