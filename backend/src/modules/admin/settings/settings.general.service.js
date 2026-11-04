const Settings = require('../../../models/Settings');
const DefaultResources = require('../../../models/DefaultResources');
const { clearSettingsCache } = require('../../../lib/settings');
const { getOrSetCache, deleteCache, acquireLock, releaseLock } = require('../../../lib/redis');
const { writeAudit } = require('../../../middleware/audit');
const AppError = require('../../../utils/AppError');

async function getOrCreateSettings() {
  let doc = await Settings.findOne({});
  if (!doc) {
    doc = await Settings.create({});
  }
  return doc;
}

async function getBrandSettings() {
  return getOrSetCache('admin:settings:brand', async () => {
    const settings = await getOrCreateSettings();
    return {
      siteName: settings.siteName || 'PteroDash',
      siteIcon: settings.siteIcon || '',
    };
  }, 30);
}

async function updateBrandSettings(data, req) {
  const lockKey = 'admin:settings:lock';
  const lockToken = await acquireLock(lockKey, 3000);
  if (!lockToken) throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');

  try {
    const settings = await getOrCreateSettings();
    const changes = {};
    if (data.siteName !== undefined && data.siteName !== settings.siteName) {
      changes.siteName = { old: settings.siteName, new: data.siteName };
      settings.siteName = data.siteName;
    }
    if (data.siteIcon !== undefined && data.siteIcon !== settings.siteIcon) {
      changes.siteIcon = { old: settings.siteIcon, new: data.siteIcon };
      settings.siteIcon = data.siteIcon;
    }

    await settings.save();
    await clearSettingsCache();
    await Promise.allSettled([
      deleteCache('admin:settings:brand'),
      deleteCache('admin:settings'),
      deleteCache('api:config'),
      deleteCache('branding:data'),
      deleteCache('site:branding'),
      deleteCache('api:branding'),
    ]);

    await writeAudit(req, 'admin.settings.update.brand', 'settings', 'brand', { changes });
    return {
      siteName: settings.siteName,
      siteIcon: settings.siteIcon,
    };
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}

async function getLocalizationSettings() {
  return getOrSetCache('admin:settings:localization', async () => {
    const settings = await getOrCreateSettings();
    return {
      localization: {
        currency: settings.localization?.currency || 'USD',
        timezone: settings.localization?.timezone || 'UTC',
      },
    };
  }, 30);
}

async function updateLocalizationSettings(data, req) {
  const lockKey = 'admin:settings:lock';
  const lockToken = await acquireLock(lockKey, 3000);
  if (!lockToken) throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');

  try {
    const settings = await getOrCreateSettings();
    const loc = data.localization || data;
    settings.localization = settings.localization || {};

    const changes = {};
    if (loc.currency !== undefined && loc.currency !== settings.localization.currency) {
      changes.currency = { old: settings.localization.currency, new: loc.currency };
      settings.localization.currency = loc.currency;
    }
    if (loc.timezone !== undefined && loc.timezone !== settings.localization.timezone) {
      changes.timezone = { old: settings.localization.timezone, new: loc.timezone };
      settings.localization.timezone = loc.timezone;
    }

    await settings.save();
    await clearSettingsCache();
    await Promise.allSettled([
      deleteCache('admin:settings:localization'),
      deleteCache('admin:settings'),
      deleteCache('api:config'),
      deleteCache('branding:data'),
      deleteCache('api:branding'),
    ]);

    await writeAudit(req, 'admin.settings.update.localization', 'settings', 'localization', { changes });
    return {
      localization: {
        currency: settings.localization.currency,
        timezone: settings.localization.timezone,
      },
    };
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}

async function getResourcesSettings() {
  return getOrSetCache('admin:settings:resources', async () => {
    let defaults = await DefaultResources.findOne({}).lean();
    if (!defaults) {
      const created = await DefaultResources.create({});
      defaults = created.toObject();
    }
    const { _id: _dbId, __v: _v, createdAt: _c, updatedAt: _u, ...cleanDefaults } = defaults;
    return {
      defaults: cleanDefaults,
    };
  }, 30);
}

async function updateResourcesSettings(data, req) {
  const lockKey = 'admin:settings:lock';
  const lockToken = await acquireLock(lockKey, 3000);
  if (!lockToken) throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');

  try {
    const defaultsData = data.defaults || data;
    let defaultResources = await DefaultResources.findOne({});
    if (!defaultResources) {
      defaultResources = await DefaultResources.create({});
    }
    Object.assign(defaultResources, defaultsData);
    await defaultResources.save();

    const settings = await getOrCreateSettings();
    settings.defaults = { ...(settings.defaults || {}), ...defaultsData };
    await settings.save();

    await clearSettingsCache();
    await Promise.allSettled([
      deleteCache('admin:settings:resources'),
      deleteCache('admin:settings'),
    ]);

    await writeAudit(req, 'admin.settings.update.resources', 'settings', 'resources', {});
    return getResourcesSettings();
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}

async function getReferralsSettings() {
  return getOrSetCache('admin:settings:referrals', async () => {
    const settings = await getOrCreateSettings();
    return {
      referrals: settings.referrals || { referrerCoins: 50, referredCoins: 25, customCodeMinInvites: 10 },
    };
  }, 30);
}

async function updateReferralsSettings(data, req) {
  const lockKey = 'admin:settings:lock';
  const lockToken = await acquireLock(lockKey, 3000);
  if (!lockToken) throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');

  try {
    const referralsData = data.referrals || data;
    const settings = await getOrCreateSettings();
    settings.referrals = { ...(settings.referrals || {}), ...referralsData };
    await settings.save();

    await clearSettingsCache();
    await Promise.allSettled([
      deleteCache('admin:settings:referrals'),
      deleteCache('admin:settings'),
    ]);

    await writeAudit(req, 'admin.settings.update.referrals', 'settings', 'referrals', {});
    return getReferralsSettings();
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}

module.exports = {
  getOrCreateSettings,
  getBrandSettings,
  updateBrandSettings,
  getLocalizationSettings,
  updateLocalizationSettings,
  getResourcesSettings,
  updateResourcesSettings,
  getReferralsSettings,
  updateReferralsSettings,
};

