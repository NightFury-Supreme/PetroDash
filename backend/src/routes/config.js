const express = require('express');
const { getSettings } = require('../lib/settings');
const { createRateLimiter } = require('../middleware/rateLimit');
const { getOrSetCache } = require('../lib/redis');
const AppError = require('../utils/AppError');

const router = express.Router();

const configRateLimiter = createRateLimiter(500, 15 * 60 * 1000);
router.use(configRateLimiter);

const DEFAULT_CONFIG = {
  branding: {
    siteName: 'PteroDash',
    siteIcon: '',
  },
  localization: {
    currency: 'USD',
    timezone: '',
  },
  auth: {
    emailLogin: true,
    emailVerification: false,
    discord: { enabled: false },
    google: { enabled: false },
  },
  ads: {
    enabled: false,
    publisherId: '',
    adSlots: { header: '', sidebar: '', footer: '', content: '', mobile: '' },
    adTypes: { display: true, text: true, link: true, inFeed: false, inArticle: false, matchedContent: false },
  },
  earn: {
    enabled: false,
  },
};

router.get('/', async (req, res, next) => {
  try {
    const data = await getOrSetCache('api:config', async () => {
      const settings = await getSettings();
      if (!settings) return DEFAULT_CONFIG;

      return {
        branding: {
          siteName: settings.siteName || 'PteroDash',
          siteIcon: settings.siteIcon || '',
        },
        localization: {
          currency: settings.localization?.currency || 'USD',
          timezone: settings.localization?.timezone || '',
        },
        auth: {
          emailLogin: settings.auth?.emailLogin ?? true,
          emailVerification: settings.auth?.emailVerification ?? false,
          discord: { enabled: Boolean(settings.auth?.discord?.enabled) },
          google: { enabled: Boolean(settings.auth?.google?.enabled) },
        },
        ads: {
          enabled: Boolean(settings.adsense?.enabled),
          publisherId: settings.adsense?.publisherId || '',
          adSlots: {
            header: settings.adsense?.adSlots?.header || '',
            sidebar: settings.adsense?.adSlots?.sidebar || '',
            footer: settings.adsense?.adSlots?.footer || '',
            content: settings.adsense?.adSlots?.content || '',
            mobile: settings.adsense?.adSlots?.mobile || '',
          },
          adTypes: {
            display: settings.adsense?.adTypes?.display ?? true,
            text: settings.adsense?.adTypes?.text ?? true,
            link: settings.adsense?.adTypes?.link ?? true,
            inFeed: settings.adsense?.adTypes?.inFeed ?? false,
            inArticle: settings.adsense?.adTypes?.inArticle ?? false,
            matchedContent: settings.adsense?.adTypes?.matchedContent ?? false,
          },
        },
        earn: {
          enabled: Boolean(settings.earn?.linkvertise?.enabled),
        },
      };
    }, 60);

    return res.json(data);
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Failed to fetch application configuration', 500, 'ERR_CONFIG_FETCH_FAILED'));
  }
});

module.exports = router;
