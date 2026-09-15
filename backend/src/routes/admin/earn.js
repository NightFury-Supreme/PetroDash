const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const { getSettings, clearSettingsCache } = require('../../lib/settings');
const Settings = require('../../models/Settings');
const EarnSession = require('../../models/EarnSession');

const router = express.Router();

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

router.get('/', requireAdmin, async (req, res) => {
  try {
    const s = await getSettings();
    const out = sanitizeEarn(s?.earn);
    return res.json(out);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load earn settings' });
  }
});

const earnPatchSchema = z.object({
  linkvertise: z.object({
    enabled: z.coerce.boolean().optional(),
    coins: z.coerce.number().int().min(0).max(1000000).optional(),
    cooldownSeconds: z.coerce.number().int().min(0).max(86400).optional(),
    waitSeconds: z.coerce.number().int().min(0).max(3600).optional(),
    maxClaimsPerDay: z.coerce.number().int().min(0).max(1000).optional(),
    url: z.string().max(2048).optional().or(z.literal('')),
    antiBypassToken: z.string().max(2048).optional().or(z.literal('')),
  }).optional(),
});

router.patch('/', requireAdmin, async (req, res) => {
  try {
    const parsed = earnPatchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });

    let settings = await Settings.findOne({});
    if (!settings) settings = new Settings();
    
    settings.earn = settings.earn || {};

    const update = parsed.data;

    const applyMethod = (key) => {
      if (!update[key]) return;
      settings.earn[key] = settings.earn[key] || {};
      const src = update[key];
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
        return res.status(400).json({ error: 'Cannot enable Linkvertise: missing required URL template.' });
      }
    }

    const originalEarn = JSON.parse(JSON.stringify(sanitizeEarn(settings.toObject().earn)));
    
    settings.markModified('earn');
    await settings.save();
    clearSettingsCache();

    const newEarn = sanitizeEarn(settings.toObject().earn);
    const changes = {};
    for (const [method, methodData] of Object.entries(update)) {
      if (originalEarn[method]) {
        for (const k of Object.keys(methodData)) {
          if (JSON.stringify(originalEarn[method][k]) !== JSON.stringify(newEarn[method][k])) {
            changes[`${method}.${k}`] = { old: originalEarn[method][k], new: newEarn[method][k] };
          }
        }
      }
    }

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.earn.update', 'earn_settings', null, { changes: Object.keys(changes).length > 0 ? changes : undefined });

    return res.json(sanitizeEarn(settings.earn));
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update earn settings' });
  }
});

router.get('/sessions', requireAdmin, async (req, res) => {
  try {
    const { userId, method, status } = req.query;
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

    const list = await EarnSession.find(q).sort({ createdAt: -1 }).limit(500).lean();
    return res.json(list);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load earn sessions' });
  }
});

module.exports = router;
