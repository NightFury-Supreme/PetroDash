const express = require('express');
const Settings = require('../../models/Settings');
const router = express.Router();

// GET /api/auth/ - Public endpoint to get auth configuration
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      return res.json({
        emailLogin: true,
        discord: { enabled: false },
        google: { enabled: false }
      });
    }

    return res.json({
      emailLogin: settings.auth?.emailLogin ?? true,
      discord: {
        enabled: settings.auth?.discord?.enabled ?? false
      },
      google: {
        enabled: settings.auth?.google?.enabled ?? false
      }
    });
  } catch (error) {
    console.error('Failed to fetch auth configuration:', error);
    return res.status(500).json({
      error: 'Failed to fetch auth configuration'
    });
  }
});

module.exports = router;
