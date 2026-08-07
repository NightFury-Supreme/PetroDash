const express = require('express');
const { getSettings } = require('../../lib/settings');
const router = express.Router();

// GET /api/auth/ - Public endpoint to get auth configuration
router.get('/', async (req, res) => {
  try {
    const settings = await getSettings();
    if (!settings) {
      return res.json({
        emailLogin: true,
        emailVerification: false,
        discord: { enabled: false },
        google: { enabled: false }
      });
    }

    return res.json({
      emailLogin: settings.auth?.emailLogin ?? true,
      emailVerification: settings.auth?.emailVerification ?? false,
      discord: {
        enabled: settings.auth?.discord?.enabled ?? false
      },
      google: {
        enabled: settings.auth?.google?.enabled ?? false
      }
    });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (error) {
    // Auth config error logged silently
    return res.status(500).json({
      error: 'Failed to fetch auth configuration'
    });
  }
});

module.exports = router;
