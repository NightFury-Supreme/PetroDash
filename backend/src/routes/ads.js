const express = require('express');
const { getSettings } = require('../lib/settings');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Rate limiting for ads endpoint - increased to handle multiple ad components per page
const adsRateLimiter = createRateLimiter(500, 15 * 60 * 1000); // 500 requests per 15 minutes
router.use(adsRateLimiter);

// GET /api/ads - Public endpoint for AdSense settings
router.get('/', async (req, res) => {
  try {
    const { getCache, setCache } = require('../lib/redis');
    const cached = await getCache('api:ads');
    if (cached) return res.json(cached);

    const settings = await getSettings();
    
    if (!settings || !settings.adsense) {
      const defaultAds = {
        enabled: false,
        publisherId: '',
        adSlots: {
          header: '',
          sidebar: '',
          footer: '',
          content: '',
          mobile: ''
        },
        adTypes: {
          display: true,
          text: true,
          link: true,
          inFeed: false,
          inArticle: false,
          matchedContent: false
        }
      };
      await setCache('api:ads', defaultAds, 60);
      return res.json(defaultAds);
    }

    // Return only AdSense settings, no sensitive data
    await setCache('api:ads', settings.adsense, 60);
    return res.json(settings.adsense);
  } catch (error) {
    console.error('Failed to fetch AdSense settings:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch AdSense settings',
      message: 'An internal server error occurred'
    });
  }
});

module.exports = router;
