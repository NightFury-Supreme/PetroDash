const Settings = require('../models/Settings');
const { getOrSetCache, deleteCache } = require('./redis');

async function getSettings() {
  const settings = await getOrSetCache(
    'global:settings',
    async () => {
      const doc = await Settings.findOne({}).lean();
      return doc || {};
    },
    300
  );
  return settings || {};
}

async function clearSettingsCache() {
  await deleteCache('global:settings');
}

module.exports = { getSettings, clearSettingsCache };
