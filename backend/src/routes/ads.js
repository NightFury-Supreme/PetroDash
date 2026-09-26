const express = require('express');
const { getSettings } = require('../lib/settings');
const { createRateLimiter } = require('../middleware/rateLimit');
const { getCache, setCache } = require('../lib/redis');
const AppError = require('../utils/AppError');

const router = express.Router();

const adsRateLimiter = createRateLimiter(500, 15 * 60 * 1000);
router.use(adsRateLimiter);

const DEFAULT_ADS = {
  enabled: false,
  publisherId: '',
  adSlots: { header: '', sidebar: '', footer: '', content: '', mobile: '' },
  adTypes: { display: true, text: true, link: true, inFeed: false, inArticle: false, matchedContent: false }
};

router.get('/', async (req, res, next) => {
  try {
    const cached = await getCache('api:ads');
    if (cached) return res.json(cached);

    const settings = await getSettings();

    if (!settings || !settings.adsense) {
      await setCache('api:ads', DEFAULT_ADS, 60);
      return res.json(DEFAULT_ADS);
    }

    await setCache('api:ads', settings.adsense, 60);
    return res.json(settings.adsense);
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Failed to fetch AdSense settings', 500, 'ERR_ADSENSE_FETCH_FAILED'));
  }
});

module.exports = router;
