const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const {
  getBrandSettingsHandler,
  updateBrandSettingsHandler,
  getLocalizationSettingsHandler,
  updateLocalizationSettingsHandler,
  getAuthSettingsHandler,
  updateAuthSettingsHandler,
  getEmailSettingsHandler,
  updateEmailSettingsHandler,
  getResourcesSettingsHandler,
  updateResourcesSettingsHandler,
  getReferralsSettingsHandler,
  updateReferralsSettingsHandler,
  getAdSenseSettingsHandler,
  updateAdSenseSettingsHandler,
  getPayPalSettingsHandler,
  updatePayPalSettingsHandler,
} = require('../../modules/admin/settings');

const router = express.Router();

const settingsRateLimiter = createRateLimiter(50, 15 * 60 * 1000);
router.use('/', settingsRateLimiter);

router.get('/brand', requireAdmin, getBrandSettingsHandler);
router.patch('/brand', requireAdmin, updateBrandSettingsHandler);

router.get('/localization', requireAdmin, getLocalizationSettingsHandler);
router.patch('/localization', requireAdmin, updateLocalizationSettingsHandler);

router.get('/auth', requireAdmin, getAuthSettingsHandler);
router.patch('/auth', requireAdmin, updateAuthSettingsHandler);

router.get('/email', requireAdmin, getEmailSettingsHandler);
router.patch('/email', requireAdmin, updateEmailSettingsHandler);

router.get('/resources', requireAdmin, getResourcesSettingsHandler);
router.patch('/resources', requireAdmin, updateResourcesSettingsHandler);

router.get('/referrals', requireAdmin, getReferralsSettingsHandler);
router.patch('/referrals', requireAdmin, updateReferralsSettingsHandler);

router.get('/adsense', requireAdmin, getAdSenseSettingsHandler);
router.patch('/adsense', requireAdmin, updateAdSenseSettingsHandler);

router.get('/paypal', requireAdmin, getPayPalSettingsHandler);
router.patch('/paypal', requireAdmin, updatePayPalSettingsHandler);

module.exports = router;
