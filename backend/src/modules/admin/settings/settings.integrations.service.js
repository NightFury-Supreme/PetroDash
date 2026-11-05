const Email = require('../../../models/Email');
const { getOrCreateSettings } = require('./settings.general.service');
const { clearSettingsCache } = require('../../../lib/settings');
const { getOrSetCache, deleteCache, acquireLock, releaseLock } = require('../../../lib/redis');
const { reconfigureStrategies } = require('../../auth');
const { writeAudit } = require('../../../middleware/audit');
const AppError = require('../../../utils/AppError');

const isValidUrl = (v) => {
  try {
    const s = String(v || '').trim();
    if (!s) return false;
    if (s.startsWith('/')) return true;
    new URL(s);
    return true;
  } catch (_urlErr) {
    return false;
  }
};

async function getAuthSettings() {
  return getOrSetCache('admin:settings:auth', async () => {
    const settings = await getOrCreateSettings();
    const auth = settings.auth || {};
    return {
      auth: {
        emailLogin: auth.emailLogin ?? true,
        emailVerification: auth.emailVerification ?? false,
        discord: {
          ...(auth.discord || {}),
          clientSecret: auth.discord?.clientSecret ? '***' : '',
          botToken: auth.discord?.botToken ? '***' : '',
        },
        google: {
          ...(auth.google || {}),
          clientSecret: auth.google?.clientSecret ? '***' : '',
        },
      },
    };
  }, 30);
}

async function updateAuthSettings(data, req) {
  const lockKey = 'admin:settings:lock';
  const lockToken = await acquireLock(lockKey, 3000);
  if (!lockToken) throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');

  try {
    const payload = data.auth || data;
    if (payload.discord?.clientSecret === '***') delete payload.discord.clientSecret;
    if (payload.discord?.botToken === '***') delete payload.discord.botToken;
    if (payload.google?.clientSecret === '***') delete payload.google.clientSecret;

    const settings = await getOrCreateSettings();
    const orig = settings.auth || {};
    settings.auth = settings.auth || {};

    if (payload.emailLogin !== undefined) settings.auth.emailLogin = payload.emailLogin;
    if (payload.emailVerification !== undefined) settings.auth.emailVerification = payload.emailVerification;
    if (payload.discord) settings.auth.discord = { ...(orig.discord || {}), ...payload.discord };
    if (payload.google) settings.auth.google = { ...(orig.google || {}), ...payload.google };

    await settings.save();
    await clearSettingsCache();
    await Promise.allSettled([
      deleteCache('admin:settings:auth'),
      deleteCache('admin:settings'),
      deleteCache('auth:config'),
      deleteCache('api:config'),
    ]);

    try {
      await reconfigureStrategies();
    } catch (_err) {}

    await writeAudit(req, 'admin.settings.update.auth', 'settings', 'auth', {});
    return getAuthSettings();
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}

async function getEmailSettings() {
  return getOrSetCache('admin:settings:email', async () => {
    const emailSettings = await Email.getOrCreate();
    const smtp = emailSettings.smtp || {};
    const safeSmtp = {
      ...smtp,
      pass: smtp.pass ? '***' : '',
    };
    return {
      smtp: safeSmtp,
      payments: { smtp: safeSmtp },
    };
  }, 30);
}

async function updateEmailSettings(data, req) {
  const lockKey = 'admin:settings:lock';
  const lockToken = await acquireLock(lockKey, 3000);
  if (!lockToken) throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');

  try {
    const smtpData = data.smtp || data.payments?.smtp || data;
    if (smtpData.pass === '***') delete smtpData.pass;

    let emailSettings = await Email.findOne({});
    if (!emailSettings) emailSettings = await Email.create({});
    const origSmtp = emailSettings.smtp?.toObject ? emailSettings.smtp.toObject() : (emailSettings.smtp || {});

    emailSettings.smtp = { ...origSmtp, ...smtpData };
    await emailSettings.save();

    await Promise.allSettled([
      deleteCache('admin:settings:email'),
      deleteCache('admin:settings'),
      deleteCache('email:settings'),
      deleteCache('api:email:settings'),
    ]);

    await writeAudit(req, 'admin.settings.update.email', 'settings', 'email', {});
    return getEmailSettings();
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}

async function getAdSenseSettings() {
  return getOrSetCache('admin:settings:adsense', async () => {
    const settings = await getOrCreateSettings();
    return {
      adsense: settings.adsense || { enabled: false, publisherId: '', adSlots: {}, adTypes: {} },
    };
  }, 30);
}

async function updateAdSenseSettings(data, req) {
  const lockKey = 'admin:settings:lock';
  const lockToken = await acquireLock(lockKey, 3000);
  if (!lockToken) throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');

  try {
    const adsenseData = data.adsense || data;
    const settings = await getOrCreateSettings();
    const orig = settings.adsense || {};
    settings.adsense = {
      ...orig,
      ...adsenseData,
      adSlots: { ...(orig.adSlots || {}), ...(adsenseData.adSlots || {}) },
      adTypes: { ...(orig.adTypes || {}), ...(adsenseData.adTypes || {}) },
    };
    await settings.save();

    await clearSettingsCache();
    await Promise.allSettled([
      deleteCache('admin:settings:adsense'),
      deleteCache('admin:settings'),
      deleteCache('api:ads'),
      deleteCache('api:config'),
    ]);

    await writeAudit(req, 'admin.settings.update.adsense', 'settings', 'adsense', {});
    return getAdSenseSettings();
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}

async function getPayPalSettings() {
  return getOrSetCache('admin:settings:paypal', async () => {
    const settings = await getOrCreateSettings();
    const paypal = settings.payments?.paypal || {};
    const safePaypal = {
      ...paypal,
      clientSecret: paypal.clientSecret ? '***' : '',
    };
    return {
      paypal: safePaypal,
      payments: { paypal: safePaypal },
    };
  }, 30);
}

async function updatePayPalSettings(data, req) {
  const lockKey = 'admin:settings:lock';
  const lockToken = await acquireLock(lockKey, 3000);
  if (!lockToken) throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');

  try {
    const paypalData = data.paypal || data.payments?.paypal || data;
    if (paypalData.clientSecret === '***') delete paypalData.clientSecret;

    if (paypalData.returnUrl && !isValidUrl(paypalData.returnUrl)) {
      throw AppError.badRequest('Invalid return URL format', 'ERR_INVALID_RETURN_URL');
    }
    if (paypalData.cancelUrl && !isValidUrl(paypalData.cancelUrl)) {
      throw AppError.badRequest('Invalid cancel URL format', 'ERR_INVALID_CANCEL_URL');
    }

    const settings = await getOrCreateSettings();
    settings.payments = settings.payments || {};
    settings.payments.paypal = { ...(settings.payments?.paypal || {}), ...paypalData };
    await settings.save();

    await clearSettingsCache();
    await Promise.allSettled([
      deleteCache('admin:settings:paypal'),
      deleteCache('admin:settings'),
    ]);

    await writeAudit(req, 'admin.settings.update.paypal', 'settings', 'paypal', {});
    return getPayPalSettings();
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}

module.exports = {
  getAuthSettings,
  updateAuthSettings,
  getEmailSettings,
  updateEmailSettings,
  getAdSenseSettings,
  updateAdSenseSettings,
  getPayPalSettings,
  updatePayPalSettings,
};

