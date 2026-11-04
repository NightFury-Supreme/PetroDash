const tabsService = require('./settings.tabs.service');
const {
  brandSchema,
  localizationSchema,
  authSchema,
  emailSchema,
  resourcesSchema,
  referralsSchema,
  adsenseSchema,
  paypalSchema,
} = require('./settings.schema');
const AppError = require('../../../utils/AppError');

async function getBrandSettingsHandler(req, res, next) {
  try {
    const data = await tabsService.getBrandSettings();
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function updateBrandSettingsHandler(req, res, next) {
  try {
    const parsed = brandSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid brand payload', 'ERR_SETTINGS_VALIDATION_FAILED', parsed.error.flatten());
    }
    const data = await tabsService.updateBrandSettings(parsed.data, req);
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getLocalizationSettingsHandler(req, res, next) {
  try {
    const data = await tabsService.getLocalizationSettings();
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function updateLocalizationSettingsHandler(req, res, next) {
  try {
    const parsed = localizationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid localization payload', 'ERR_SETTINGS_VALIDATION_FAILED', parsed.error.flatten());
    }
    const data = await tabsService.updateLocalizationSettings(parsed.data, req);
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getAuthSettingsHandler(req, res, next) {
  try {
    const data = await tabsService.getAuthSettings();
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function updateAuthSettingsHandler(req, res, next) {
  try {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid auth payload', 'ERR_SETTINGS_VALIDATION_FAILED', parsed.error.flatten());
    }
    const data = await tabsService.updateAuthSettings(parsed.data, req);
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getEmailSettingsHandler(req, res, next) {
  try {
    const data = await tabsService.getEmailSettings();
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function updateEmailSettingsHandler(req, res, next) {
  try {
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid email payload', 'ERR_SETTINGS_VALIDATION_FAILED', parsed.error.flatten());
    }
    const data = await tabsService.updateEmailSettings(parsed.data, req);
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getResourcesSettingsHandler(req, res, next) {
  try {
    const data = await tabsService.getResourcesSettings();
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function updateResourcesSettingsHandler(req, res, next) {
  try {
    const parsed = resourcesSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid resources payload', 'ERR_SETTINGS_VALIDATION_FAILED', parsed.error.flatten());
    }
    const data = await tabsService.updateResourcesSettings(parsed.data, req);
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getReferralsSettingsHandler(req, res, next) {
  try {
    const data = await tabsService.getReferralsSettings();
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function updateReferralsSettingsHandler(req, res, next) {
  try {
    const parsed = referralsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid referrals payload', 'ERR_SETTINGS_VALIDATION_FAILED', parsed.error.flatten());
    }
    const data = await tabsService.updateReferralsSettings(parsed.data, req);
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getAdSenseSettingsHandler(req, res, next) {
  try {
    const data = await tabsService.getAdSenseSettings();
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function updateAdSenseSettingsHandler(req, res, next) {
  try {
    const parsed = adsenseSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid adsense payload', 'ERR_SETTINGS_VALIDATION_FAILED', parsed.error.flatten());
    }
    const data = await tabsService.updateAdSenseSettings(parsed.data, req);
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getPayPalSettingsHandler(req, res, next) {
  try {
    const data = await tabsService.getPayPalSettings();
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function updatePayPalSettingsHandler(req, res, next) {
  try {
    const parsed = paypalSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid paypal payload', 'ERR_SETTINGS_VALIDATION_FAILED', parsed.error.flatten());
    }
    const data = await tabsService.updatePayPalSettings(parsed.data, req);
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
};
