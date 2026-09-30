const Settings = require('../../../models/Settings');
const DefaultResources = require('../../../models/DefaultResources');
const Email = require('../../../models/Email');
const { clearSettingsCache } = require('../../../lib/settings');
const { getCache, setCache, deleteCachePattern } = require('../../../lib/redis');
const { reconfigureStrategies } = require('../../../routes/auth/oauth');
const AppError = require('../../../utils/AppError');

async function getOrCreate() {
  try {
    let doc = await Settings.findOne({});
    if (!doc) {
      doc = await Settings.create({});
    }
    return doc;
  } catch (_error) {
    throw AppError.internal('Failed to access settings database', 'ERR_SETTINGS_DB_ACCESS');
  }
}

async function getSettings() {
  const cached = await getCache('admin:settings');
  if (cached) return cached;

  const [settings, emailSettings] = await Promise.all([
    getOrCreate(),
    Email.getOrCreate()
  ]);

  const {
    __v: _v,
    themePrimary: _themePrimary,
    earn: _earn,
    ticketCategories: _ticketCategories,
    ...apiSettings
  } = settings.toObject();

  const responseDto = {
    ...apiSettings,
    payments: {
      ...(apiSettings.payments || {}),
      paypal: {
        ...(apiSettings.payments?.paypal || {}),
        clientSecret: apiSettings.payments?.paypal?.clientSecret ? '***' : ''
      },
      smtp: {
        ...(emailSettings.smtp || {}),
        pass: emailSettings.smtp?.pass ? '***' : ''
      }
    },
    auth: {
      ...(apiSettings.auth || {}),
      emailLogin: apiSettings.auth?.emailLogin ?? true,
      emailVerification: apiSettings.auth?.emailVerification ?? false,
      discord: {
        ...(apiSettings.auth?.discord || {}),
        clientSecret: apiSettings.auth?.discord?.clientSecret ? '***' : '',
        botToken: apiSettings.auth?.discord?.botToken ? '***' : ''
      },
      google: {
        ...(apiSettings.auth?.google || {}),
        clientSecret: apiSettings.auth?.google?.clientSecret ? '***' : ''
      }
    }
  };
  
  await setCache('admin:settings', responseDto, 30);
  return responseDto;
}

const isValidUrl = (v) => {
  try {
    const s = String(v || '').trim();
    if (!s) return false;
    if (s.startsWith('/')) return true;
    new URL(s);
    return true;
  } catch {
    return false;
  }
};

async function updateSettings(parsedData) {
  if (parsedData.auth?.discord?.clientSecret === '***') delete parsedData.auth.discord.clientSecret;
  if (parsedData.auth?.discord?.botToken === '***') delete parsedData.auth.discord.botToken;
  if (parsedData.auth?.google?.clientSecret === '***') delete parsedData.auth.google.clientSecret;
  if (parsedData.payments?.paypal?.clientSecret === '***') delete parsedData.payments.paypal.clientSecret;
  if (parsedData.payments?.smtp?.pass === '***') delete parsedData.payments.smtp.pass;

  const settings = await getOrCreate();
  const originalSettings = settings.toObject();
  const update = { ...parsedData };
  let authUpdated = false;

  delete update.themePrimary;

  if (update.payments) {
    if (update.payments.paypal) {
      settings.payments = settings.payments || {};
      settings.payments.paypal = { ...(originalSettings.payments?.paypal || {}), ...update.payments.paypal };
      delete update.payments.paypal;
    }
    if (update.payments.smtp) {
      let emailSettings = await Email.findOne({});
      if (!emailSettings) emailSettings = await Email.create({});
      const originalEmailSettings = emailSettings.toObject();
      emailSettings.smtp = { ...(originalEmailSettings.smtp || {}), ...update.payments.smtp };
      await emailSettings.save();
      await deleteCachePattern('email:settings');
      await deleteCachePattern('api:email:settings');
      delete update.payments.smtp;
    }
  }
  if (update.payments && Object.keys(update.payments).length === 0) {
    delete update.payments;
  }

  if (update.auth) {
    authUpdated = true;
    settings.auth = settings.auth || {};
    if (update.auth.emailLogin !== undefined) {
      settings.auth.emailLogin = update.auth.emailLogin;
    }
    if (update.auth.emailVerification !== undefined) {
      settings.auth.emailVerification = update.auth.emailVerification;
    }
    if (update.auth.discord) {
      settings.auth.discord = { ...(originalSettings.auth?.discord || {}), ...update.auth.discord };
    }
    if (update.auth.google) {
      settings.auth.google = { ...(originalSettings.auth?.google || {}), ...update.auth.google };
    }
    delete update.auth;
  }

  if (update.adsense) {
    settings.adsense = settings.adsense || {};
    if (update.adsense.enabled !== undefined) {
      settings.adsense.enabled = update.adsense.enabled;
    }
    if (update.adsense.publisherId !== undefined) {
      settings.adsense.publisherId = update.adsense.publisherId;
    }
    if (update.adsense.adSlots) {
      settings.adsense.adSlots = { ...(originalSettings.adsense?.adSlots || {}), ...update.adsense.adSlots };
    }
    if (update.adsense.adTypes) {
      settings.adsense.adTypes = { ...(originalSettings.adsense?.adTypes || {}), ...update.adsense.adTypes };
    }
    delete update.adsense;
  }

  Object.assign(settings, update);

  const paypalCfg = settings?.payments?.paypal || {};
  if (paypalCfg?.enabled) {
    const returnUrl = String(paypalCfg.returnUrl || '').trim();
    const cancelUrl = String(paypalCfg.cancelUrl || '').trim();
    if (returnUrl && !isValidUrl(returnUrl)) {
      throw AppError.badRequest('Invalid return URL format', 'ERR_INVALID_RETURN_URL', { formErrors: [], fieldErrors: { payments: ['Invalid return URL format'] } });
    }
    if (cancelUrl && !isValidUrl(cancelUrl)) {
      throw AppError.badRequest('Invalid cancel URL format', 'ERR_INVALID_CANCEL_URL', { formErrors: [], fieldErrors: { payments: ['Invalid cancel URL format'] } });
    }
  }

  await settings.save();
  await clearSettingsCache();

  await deleteCachePattern('admin:settings');
  await deleteCachePattern('auth:oauth:status');
  await deleteCachePattern('api:ads');

  if (authUpdated) {
    try {
      await reconfigureStrategies();
    } catch (_error) {
      // Reconfiguration non-fatal fallback
    }
  }

  if (parsedData?.defaults) {
    try {
      let defaultResources = await DefaultResources.findOne({});
      if (!defaultResources) {
        defaultResources = await DefaultResources.create({});
      }
      Object.assign(defaultResources, parsedData.defaults);
      await defaultResources.save();
    } catch (_error) {
      // Default resources update non-fatal fallback
    }
  }

  const response = await getSettings();
  
  const changes = {};
  const sensitiveKeys = ['clientSecret', 'botToken', 'pass', 'webhookId', 'apiKey'];
  const checkDiff = (target, source, original, prefix = '') => {
    for (const k of Object.keys(source || {})) {
      if (typeof source[k] === 'object' && source[k] !== null && !Array.isArray(source[k])) {
        checkDiff(target, source[k], (original[k] || {}), prefix ? `${prefix}.${k}` : k);
      } else {
        const keyName = prefix ? `${prefix}.${k}` : k;
        if (JSON.stringify(original[k]) !== JSON.stringify(source[k])) {
          const isSensitive = sensitiveKeys.includes(k);
          target[keyName] = { 
            old: isSensitive ? (original[k] ? '***' : null) : original[k], 
            new: isSensitive ? (source[k] ? '***' : null) : source[k] 
          };
        }
      }
    }
  };
  checkDiff(changes, parsedData, originalSettings);

  return { response, changes, settingsId: settings._id.toString() };
}

module.exports = { getSettings, updateSettings };
