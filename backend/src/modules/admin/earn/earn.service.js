const { getSettings, clearSettingsCache } = require('../../../lib/settings');
const Settings = require('../../../models/Settings');
const EarnSession = require('../../../models/EarnSession');
const AppError = require('../../../utils/AppError');

function normalizeMethod(obj, def) {
  if (!obj) return def;
  return {
    enabled: !!obj.enabled,
    coins: Number(obj.coins || def.coins || 0),
    cooldownSeconds: Number(obj.cooldownSeconds || def.cooldownSeconds || 0),
    waitSeconds: Number(obj.waitSeconds || def.waitSeconds || 0),
    maxClaimsPerDay: Number(obj.maxClaimsPerDay || def.maxClaimsPerDay || 0),
    url: obj.url !== undefined ? obj.url : def.url,
    antiBypassToken: obj.antiBypassToken !== undefined ? obj.antiBypassToken : def.antiBypassToken,
  };
}

function sanitizeEarn(e) {
  if (!e) e = {};
  return {
    linkvertise: normalizeMethod(e.linkvertise, { coins: 20, cooldownSeconds: 3600, waitSeconds: 10, maxClaimsPerDay: 24, url: '', antiBypassToken: '' }),
  };
}

class EarnService {
  async getSettings() {
    const s = await getSettings();
    return sanitizeEarn(s?.earn);
  }

  async updateSettings(updateData) {
    let settings = await Settings.findOne({});
    if (!settings) settings = new Settings();
    
    settings.earn = settings.earn || {};

    const applyMethod = (key) => {
      if (!updateData[key]) return;
      settings.earn[key] = settings.earn[key] || {};
      const src = updateData[key];
      if (src.enabled !== undefined) settings.earn[key].enabled = src.enabled;
      if (src.coins !== undefined) settings.earn[key].coins = src.coins;
      if (src.cooldownSeconds !== undefined) settings.earn[key].cooldownSeconds = src.cooldownSeconds;
      if (src.waitSeconds !== undefined) settings.earn[key].waitSeconds = src.waitSeconds;
      if (src.maxClaimsPerDay !== undefined) settings.earn[key].maxClaimsPerDay = src.maxClaimsPerDay;
      if (key === 'linkvertise' && src.url !== undefined) settings.earn[key].url = src.url;
      if (key === 'linkvertise' && src.antiBypassToken !== undefined) settings.earn[key].antiBypassToken = src.antiBypassToken;
    };

    applyMethod('linkvertise');

    const lvConfigured = Boolean(String(settings?.earn?.linkvertise?.url || '').trim());
    if (settings.earn.linkvertise && settings.earn.linkvertise.enabled) {
      if (!lvConfigured) {
        throw new AppError('Cannot enable Linkvertise: missing required URL template.', 400);
      }
    }

    const originalEarn = JSON.parse(JSON.stringify(sanitizeEarn(settings.toObject().earn)));
    
    settings.markModified('earn');
    await settings.save();
    clearSettingsCache();

    const newEarn = sanitizeEarn(settings.toObject().earn);
    const changes = {};
    for (const [method, methodData] of Object.entries(updateData)) {
      if (originalEarn[method]) {
        for (const k of Object.keys(methodData)) {
          if (JSON.stringify(originalEarn[method][k]) !== JSON.stringify(newEarn[method][k])) {
            changes[`${method}.${k}`] = { old: originalEarn[method][k], new: newEarn[method][k] };
          }
        }
      }
    }
    
    return {
      updatedEarn: newEarn,
      changes
    };
  }

  async getSessions({ userId, method, status }) {
    const q = {};

    if (userId && /^[0-9a-fA-F]{24}$/.test(String(userId))) {
      q.userId = { $eq: String(userId) };
    }
    if (method && ['linkvertise'].includes(String(method))) {
      q.method = { $eq: String(method) };
    }
    if (status && ['started', 'completed', 'expired'].includes(String(status))) {
      q.status = { $eq: String(status) };
    }

    return await EarnSession.find(q).sort({ createdAt: -1 }).limit(500).lean();
  }
}

module.exports = new EarnService();
