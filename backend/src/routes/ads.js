const express = require('express');
const Settings = require('../models/Settings');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Rate limiting for ads endpoint
const adsRateLimiter = createRateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes
router.use(adsRateLimiter);

// GET /api/ads - Public endpoint for AdSense settings
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.findOne({});
    
    if (!settings || !settings.adsense) {
      return res.json({
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
      });
    }

    // Return only AdSense settings, no sensitive data
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
