const express = require('express');
const { getSettings } = require('../../lib/settings');
const AppError = require('../../utils/AppError');
const router = express.Router();

// GET /api/auth/ - Public endpoint to get auth configuration
router.get('/', async (req, res, next) => {
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
    return next(AppError.internal('Failed to fetch auth configuration', 'ERR_AUTH_CONFIG_FAILED'));
  }
});

module.exports = router;
