const { getSettings, clearSettingsCache } = require('../../../lib/settings');
const Settings = require('../../../models/Settings');
const EarnSession = require('../../../models/EarnSession');
const User = require('../../../models/User');
const { buildIdFilter, formatPublicEntity } = require('../../../utils/publicId');
const { deleteCachePattern } = require('../../../lib/redis');

function normalizeMethod(obj, def) {
  if (!obj) return def;
  return {
    enabled: !!obj.enabled,
    coins: Number(obj.coins ?? def.coins ?? 0),
    cooldownSeconds: Number(obj.cooldownSeconds ?? def.cooldownSeconds ?? 0),
    waitSeconds: Number(obj.waitSeconds ?? def.waitSeconds ?? 0),
    maxClaimsPerDay: Number(obj.maxClaimsPerDay ?? def.maxClaimsPerDay ?? 0),
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

  async updateSettings(payload) {
    const current = await getSettings();
    const originalEarn = sanitizeEarn(current?.earn);

    const updated = {
      ...(current?.earn || {}),
    };

    if (payload.linkvertise) {
      updated.linkvertise = {
        ...(updated.linkvertise || {}),
        ...payload.linkvertise,
      };
    }

    const doc = await Settings.findOneAndUpdate(
      {},
      { $set: { earn: updated } },
      { new: true, upsert: true }
    );

    await clearSettingsCache();
    deleteCachePattern('earn:status:*').catch(() => {});

    const newEarn = sanitizeEarn(doc.earn);

    const changes = {};
    const checkDiff = (origObj, newObj, prefix = '') => {
      for (const k of Object.keys(newObj || {})) {
        if (typeof newObj[k] === 'object' && newObj[k] !== null && !Array.isArray(newObj[k])) {
          checkDiff(origObj[k] || {}, newObj[k], prefix ? `${prefix}.${k}` : k);
        } else {
          const keyName = prefix ? `${prefix}.${k}` : k;
          if (origObj[k] !== newObj[k]) {
            const isSensitive = keyName.toLowerCase().includes('token') || keyName.toLowerCase().includes('secret');
            changes[keyName] = {
              old: isSensitive && origObj[k] ? '******' : origObj[k],
              new: isSensitive && newObj[k] ? '******' : newObj[k],
            };
          }
        }
      }
    };
    checkDiff(originalEarn, newEarn);

    return {
      updatedEarn: newEarn,
      changes,
    };
  }

  async patchSettings(payload) {
    return this.updateSettings(payload);
  }

  async getSessions({ userId, method, status }) {
    const q = {};

    if (userId) {
      const user = await User.findOne(buildIdFilter(userId)).select('_id').lean();
      if (user) {
        q.userId = user._id;
      } else {
        return [];
      }
    }
    if (method && ['linkvertise'].includes(String(method))) {
      q.method = { $eq: String(method) };
    }
    if (status && ['started', 'completed', 'expired'].includes(String(status))) {
      q.status = { $eq: String(status) };
    }

    const sessions = await EarnSession.find(q)
      .sort({ createdAt: -1 })
      .limit(500)
      .populate('userId', 'username email publicId')
      .lean();

    return sessions.map((s) => {
      const formatted = formatPublicEntity(s, 'earnSession');
      if (s.userId && typeof s.userId === 'object') {
        formatted.userId = formatPublicEntity(s.userId, 'user');
      }
      return formatted;
    });
  }
}

module.exports = new EarnService();
