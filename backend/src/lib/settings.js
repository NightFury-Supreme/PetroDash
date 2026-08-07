const Settings = require('../models/Settings');
const { getCache, setCache, deleteCache } = require('./redis');

/**
 * Get global settings with caching.
 * @returns {Promise<Object>}
 */
async function getSettings() {
    let settings = await getCache('global:settings');
    if (!settings) {
        settings = await Settings.findOne({}).lean();
        if (settings) {
            await setCache('global:settings', settings, 300); // cache for 5 minutes
        }
    }
    return settings || {};
}

/**
 * Clear the global settings cache.
 */
async function clearSettingsCache() {
    await deleteCache('global:settings');
}

module.exports = { getSettings, clearSettingsCache };
