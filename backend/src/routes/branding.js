/*
  Branding Router
  Serves public dashboard branding settings.
*/

const express = require('express');
const { getSettings } = require('../lib/settings');

const router = express.Router();

const DEFAULT_BRANDING = {
  siteName: 'PteroDash',
  siteIcon: '',
  currency: 'USD',
  earnEnabled: false,
  emailVerification: false
};

router.get('/', async (req, res) => {
  try {
    const settings = await getSettings();
    if (!settings) return res.json(DEFAULT_BRANDING);

    return res.json({
      siteName: settings.siteName || 'PteroDash',
      siteIcon: settings.siteIcon || '',
      currency: settings.localization?.currency || 'USD',
      earnEnabled: settings.earn?.linkvertise?.enabled || false,
      emailVerification: settings.auth?.emailVerification || false
    });
  } catch (_) {
    return res.json(DEFAULT_BRANDING);
  }
});

module.exports = router;
