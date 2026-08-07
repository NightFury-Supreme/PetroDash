const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const { getSettings, clearSettingsCache } = require('../../lib/settings');
const Settings = require('../../models/Settings');
const EarnSession = require('../../models/EarnSession');

const router = express.Router();

const adminEarnRateLimiter = createRateLimiter(120, 15 * 60 * 1000);
router.use(adminEarnRateLimiter);

async function getOrCreate() {
  let doc = await Settings.findOne({});
  if (!doc) doc = await Settings.create({});
  return doc;
}

function sanitizeEarn(earn) {
  const e = earn || {};
  const normalizeMethod = (m, defaults) => {
    const obj = m || {};
    return {
      enabled: Boolean(obj.enabled),
      coins: Number.isFinite(Number(obj.coins)) ? Number(obj.coins) : defaults.coins,
      cooldownSeconds: Number.isFinite(Number(obj.cooldownSeconds)) ? Number(obj.cooldownSeconds) : defaults.cooldownSeconds,
      waitSeconds: Number.isFinite(Number(obj.waitSeconds)) ? Number(obj.waitSeconds) : defaults.waitSeconds,
      maxClaimsPerDay: Number.isFinite(Number(obj.maxClaimsPerDay)) ? Number(obj.maxClaimsPerDay) : defaults.maxClaimsPerDay,
      url: typeof obj.url === 'string' ? obj.url : defaults.url,
      antiBypassToken: typeof obj.antiBypassToken === 'string' ? obj.antiBypassToken : defaults.antiBypassToken,
      ayetPlacementId: Number.isFinite(Number(obj.ayetPlacementId)) ? Number(obj.ayetPlacementId) : defaults.ayetPlacementId,
      ayetAdslotName: typeof obj.ayetAdslotName === 'string' ? obj.ayetAdslotName : defaults.ayetAdslotName,
      ayetApiKey: typeof obj.ayetApiKey === 'string' ? obj.ayetApiKey : defaults.ayetApiKey,
    };
  };

  return {
    enabled: Boolean(e.enabled),
    ads: normalizeMethod(e.ads, { coins: 10, cooldownSeconds: 3600, waitSeconds: 30, maxClaimsPerDay: 24, url: '', antiBypassToken: '', ayetPlacementId: 0, ayetAdslotName: '', ayetApiKey: '' }),
    linkvertise: normalizeMethod(e.linkvertise, { coins: 20, cooldownSeconds: 3600, waitSeconds: 10, maxClaimsPerDay: 24, url: '', antiBypassToken: '', ayetPlacementId: 0, ayetAdslotName: '', ayetApiKey: '' }),
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
  enabled: z.coerce.boolean().optional(),
  ads: z.object({
    enabled: z.coerce.boolean().optional(),
    coins: z.coerce.number().int().min(0).max(1000000).optional(),
    cooldownSeconds: z.coerce.number().int().min(0).max(86400).optional(),
    waitSeconds: z.coerce.number().int().min(0).max(3600).optional(),
    maxClaimsPerDay: z.coerce.number().int().min(0).max(1000).optional(),
    ayetPlacementId: z.coerce.number().int().min(0).max(1000000000).optional(),
    ayetAdslotName: z.string().max(256).optional().or(z.literal('')),
    ayetApiKey: z.string().max(2048).optional().or(z.literal('')),
  }).optional(),
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

    const settings = await getOrCreate();
    settings.earn = settings.earn || {};

    const update = parsed.data;
    if (update.enabled !== undefined) settings.earn.enabled = update.enabled;

    const applyMethod = (key) => {
      if (!update[key]) return;
      settings.earn[key] = settings.earn[key] || {};
      const src = update[key];
      if (src.enabled !== undefined) settings.earn[key].enabled = src.enabled;
      if (src.coins !== undefined) settings.earn[key].coins = src.coins;
      if (src.cooldownSeconds !== undefined) settings.earn[key].cooldownSeconds = src.cooldownSeconds;
      if (src.waitSeconds !== undefined) settings.earn[key].waitSeconds = src.waitSeconds;
      if (src.maxClaimsPerDay !== undefined) settings.earn[key].maxClaimsPerDay = src.maxClaimsPerDay;
      if (key === 'ads' && src.ayetPlacementId !== undefined) settings.earn[key].ayetPlacementId = src.ayetPlacementId;
      if (key === 'ads' && src.ayetAdslotName !== undefined) settings.earn[key].ayetAdslotName = src.ayetAdslotName;
      if (key === 'ads' && src.ayetApiKey !== undefined) settings.earn[key].ayetApiKey = src.ayetApiKey;
      if (key === 'linkvertise' && src.url !== undefined) settings.earn[key].url = src.url;
      if (key === 'linkvertise' && src.antiBypassToken !== undefined) settings.earn[key].antiBypassToken = src.antiBypassToken;
    };

    applyMethod('ads');
    applyMethod('linkvertise');

    const ayetConfigured = Boolean(Number(settings?.earn?.ads?.ayetPlacementId || 0) > 0)
      && Boolean(String(settings?.earn?.ads?.ayetAdslotName || '').trim())
      && Boolean(String(settings?.earn?.ads?.ayetApiKey || '').trim());

    if (settings?.earn?.ads?.enabled && !ayetConfigured) {
      return res.status(400).json({ error: 'Configure ayeT Rewarded Video (Placement ID, AdSlot name, API Key) before enabling Watch Ads' });
    }

    await settings.save();
    clearSettingsCache();

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
    if (method && ['ads', 'linkvertise'].includes(String(method))) {
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
