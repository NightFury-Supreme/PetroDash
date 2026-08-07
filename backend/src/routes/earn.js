const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const { getSettings } = require('../lib/settings');
const EarnSession = require('../models/EarnSession');
const User = require('../models/User');
const { writeAudit } = require('../middleware/audit');

const router = express.Router();

const earnRateLimiter = createRateLimiter(120, 15 * 60 * 1000, {
  skip: (req) => {
    const p = String(req.path || '');
    return p.startsWith('/ads/admob/ssv') || p.startsWith('/ads/ayet/callback');
  }
});
router.use(earnRateLimiter);

const METHOD_KEYS = ['ads', 'linkvertise'];

let admobKeyCache = { fetchedAt: 0, keys: new Map() };

async function getAdmobPublicKeys() {
  const ttlMs = 6 * 60 * 60 * 1000;
  if (admobKeyCache.keys.size && (Date.now() - admobKeyCache.fetchedAt) < ttlMs) return admobKeyCache.keys;

  const r = await axios.get('https://www.gstatic.com/admob/reward/verifier-keys.json', { timeout: 5000 });
  const list = Array.isArray(r?.data?.keys) ? r.data.keys : [];
  const map = new Map();
  for (const k of list) {
    const keyId = Number(k?.keyId);
    const pem = typeof k?.pem === 'string' ? k.pem : null;
    if (Number.isFinite(keyId) && pem) map.set(keyId, pem);
  }
  admobKeyCache = { fetchedAt: Date.now(), keys: map };
  return map;
}

function base64ToBuf(s) {
  const raw = String(s || '').replace(/\s/g, '');
  const fixed = raw.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(fixed, 'base64');
}

async function verifyLinkvertiseHash(token, hash) {
  const t = String(token || '').trim();
  const h = String(hash || '').trim();
  if (!t || !h) return { ok: false, reason: 'missing_token_or_hash' };

  const baseUrl = 'https://publisher.linkvertise.com/api/v1/anti_bypassing';
  const baseHeaders = { 'User-Agent': 'PetroDash/1.0' };

  const msgVerdict = (msg) => {
    const s = String(msg || '').trim().toLowerCase();
    if (!s) return null;
    if (s === 'true' || s === 'ok' || s === 'success') return { ok: true, reason: s };
    if (s.includes('hash was found') || s.includes('found and deleted')) return { ok: true, reason: s };
    if (s.includes('authentication token not valid')) return { ok: false, reason: 'authentication token not valid' };
    if (s.includes('hash could not be found') || s.includes('hash not found')) return { ok: false, reason: 'hash not found' };
    return { ok: false, reason: s };
  };

  const isTruthy = (data) => {
    if (data === true) return true;
    if (data === 1) return true;
    if (typeof data === 'string') {
      const s = data.trim().toLowerCase();
      return s === 'true' || s === '1' || s === 'ok' || s === 'success';
    }
    if (data && typeof data === 'object') {
      const v = data;
      if (isTruthy(v.ok) || isTruthy(v.success) || isTruthy(v.valid) || isTruthy(v.verified)) return true;

      const msg1 = msgVerdict(v.response);
      if (msg1?.ok) return true;
      const msg2 = msgVerdict(v.result);
      if (msg2?.ok) return true;
      const msg3 = msgVerdict(v.message || v.msg || v.error || v.status);
      if (msg3?.ok) return true;

      if (v.data && typeof v.data === 'object') {
        const d = v.data;
        if (isTruthy(d.ok) || isTruthy(d.success) || isTruthy(d.valid) || isTruthy(d.verified)) return true;
        const dmsg1 = msgVerdict(d.response);
        if (dmsg1?.ok) return true;
        const dmsg2 = msgVerdict(d.result);
        if (dmsg2?.ok) return true;
        const dmsg3 = msgVerdict(d.message || d.msg || d.error || d.status);
        if (dmsg3?.ok) return true;
      }
    }
    return false;
  };

  const summarizeData = (data) => {
    try {
      if (data === null) return { type: 'null' };
      const t = typeof data;
      if (t === 'string') return { type: 'string', sample: String(data).slice(0, 160) };
      if (t === 'number' || t === 'boolean') return { type: t, value: data };
      if (Array.isArray(data)) return { type: 'array', length: data.length };
      if (t === 'object') {
        const keys = Object.keys(data).slice(0, 30);
        const sample = {};
        for (const k of keys) {
          if (/token|hash/i.test(k)) continue;
          const v = data[k];
          if (v === null || v === undefined) sample[k] = v;
          else if (typeof v === 'string') sample[k] = String(v).slice(0, 160);
          else if (typeof v === 'number' || typeof v === 'boolean') sample[k] = v;
          else if (Array.isArray(v)) sample[k] = `array(${v.length})`;
          else if (typeof v === 'object') sample[k] = `object(${Object.keys(v).length})`;
          else sample[k] = typeof v;
        }
        return { type: 'object', keys, sample };
      }
      return { type: t };
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_) {
      return { type: 'unknown' };
    }
  };

  const attempts = [
    {
      name: 'post_query',
      fn: () => axios.post(`${baseUrl}?token=${encodeURIComponent(t)}&hash=${encodeURIComponent(h)}`, null, { timeout: 7000, validateStatus: () => true, headers: baseHeaders }),
    },
    {
      name: 'get_query',
      fn: () => axios.get(`${baseUrl}?token=${encodeURIComponent(t)}&hash=${encodeURIComponent(h)}`, { timeout: 7000, validateStatus: () => true, headers: baseHeaders }),
    },
    {
      name: 'post_json_body',
      fn: () => axios.post(baseUrl, { token: t, hash: h }, { timeout: 7000, validateStatus: () => true, headers: { ...baseHeaders, 'Content-Type': 'application/json' } }),
    },
    {
      name: 'post_form_body',
      fn: () => axios.post(
        baseUrl,
        new URLSearchParams({ token: t, hash: h }).toString(),
        { timeout: 7000, validateStatus: () => true, headers: { ...baseHeaders, 'Content-Type': 'application/x-www-form-urlencoded' } }
      ),
    },
    {
      name: 'post_bearer_hash_only',
      fn: () => axios.post(baseUrl, { hash: h }, { timeout: 7000, validateStatus: () => true, headers: { ...baseHeaders, Authorization: `Bearer ${t}` } }),
    },
    {
      name: 'post_auth_hash_only',
      fn: () => axios.post(baseUrl, { hash: h }, { timeout: 7000, validateStatus: () => true, headers: { ...baseHeaders, Authorization: t } }),
    },
  ];

  const attemptLogs = [];
  let lastReason = '';
  for (const a of attempts) {
    try {
      const r = await a.fn();
      const ok = r.status >= 200 && r.status < 300 && isTruthy(r.data);
      if (!ok) {
        let msg = '';
        if (r?.data && typeof r.data === 'object') {
          msg = String(r.data.response || r.data.result || r.data.message || r.data.msg || r.data.error || r.data.status || '');
        } else if (typeof r?.data === 'string') {
          msg = String(r.data);
        }
        const vd = msgVerdict(msg);
        if (vd?.reason) lastReason = vd.reason;
      }
      attemptLogs.push({ name: a.name, status: r.status, ok, data: summarizeData(r.data) });
      if (ok) return { ok: true, reason: 'ok' };
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_) {
      attemptLogs.push({ name: a.name, status: 'error', ok: false });
    }
  }

  return { ok: false, reason: lastReason || 'verify_failed' };
}

async function verifyAdmobSsvFromRequest(req) {
  const raw = String(req.originalUrl || req.url || '');
  const qs = raw.includes('?') ? raw.split('?').slice(1).join('?') : '';
  const sigIdx = qs.indexOf('signature=');
  if (sigIdx <= 0) return { ok: false, error: 'missing_signature' };
  const dataToVerifyStr = qs.substring(0, Math.max(0, sigIdx - 1));
  const dataToVerify = Buffer.from(dataToVerifyStr, 'utf8');

  const signature = base64ToBuf(req.query.signature);
  const keyId = Number(req.query.key_id);
  if (!signature.length || !Number.isFinite(keyId)) return { ok: false, error: 'bad_sig_or_key' };

  const keys = await getAdmobPublicKeys();
  const pem = keys.get(keyId);
  if (!pem) return { ok: false, error: 'unknown_key' };

  const verifier = crypto.createVerify('sha256');
  verifier.update(dataToVerify);
  verifier.end();
  const valid = verifier.verify(pem, signature);
  return { ok: Boolean(valid) };
}

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return Math.max(min, Math.min(max, i));
}

function isAyetConfigured(s) {
  const placementId = Number(s?.earn?.ads?.ayetPlacementId || 0);
  const adslotName = String(s?.earn?.ads?.ayetAdslotName || '').trim();
  const apiKey = String(s?.earn?.ads?.ayetApiKey || '').trim();
  return Number.isFinite(placementId) && placementId > 0 && Boolean(adslotName) && Boolean(apiKey);
}

function getEarnConfig(s) {
  const earn = s?.earn || {};
  const enabled = Boolean(earn.enabled);

  const normalizeMethod = (m, defaults) => {
    const obj = m || {};
    return {
      enabled: Boolean(obj.enabled),
      coins: clampInt(obj.coins, 0, 1000000, defaults.coins),
      cooldownSeconds: clampInt(obj.cooldownSeconds, 0, 86400, defaults.cooldownSeconds),
      waitSeconds: clampInt(obj.waitSeconds, 0, 3600, defaults.waitSeconds),
      maxClaimsPerDay: clampInt(obj.maxClaimsPerDay, 0, 1000, defaults.maxClaimsPerDay),
      url: typeof obj.url === 'string' ? obj.url : defaults.url,
      antiBypassToken: typeof obj.antiBypassToken === 'string' ? obj.antiBypassToken : defaults.antiBypassToken,
      ayetPlacementId: clampInt(obj.ayetPlacementId, 0, 1000000000, defaults.ayetPlacementId),
      ayetAdslotName: typeof obj.ayetAdslotName === 'string' ? obj.ayetAdslotName : defaults.ayetAdslotName,
      ayetApiKey: typeof obj.ayetApiKey === 'string' ? obj.ayetApiKey : defaults.ayetApiKey,
    };
  };

  return {
    enabled,
    ads: normalizeMethod(earn.ads, { coins: 10, cooldownSeconds: 3600, waitSeconds: 30, maxClaimsPerDay: 24, url: '', antiBypassToken: '', ayetPlacementId: 0, ayetAdslotName: '', ayetApiKey: '' }),
    linkvertise: normalizeMethod(earn.linkvertise, { coins: 20, cooldownSeconds: 3600, waitSeconds: 10, maxClaimsPerDay: 24, url: '', antiBypassToken: '' }),
  };
}

function phpUrlencode(value) {
  const s = String(value ?? '');
  return encodeURIComponent(s)
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildSortedQueryString(query) {
  const keys = Object.keys(query || {}).sort((a, b) => String(a).localeCompare(String(b)));
  const parts = [];
  for (const k of keys) {
    const raw = query[k];
    if (raw === undefined) continue;
    const v = Array.isArray(raw) ? raw[0] : raw;
    parts.push(`${k}=${phpUrlencode(v)}`);
  }
  return parts.join('&');
}

function verifyAyetCallbackHmac(req, apiKey) {
  const provided = String(req.headers['x-ayetstudios-security-hash'] || '').trim();
  if (!provided) return { ok: false, error: 'missing_hmac' };
  const sorted = buildSortedQueryString(req.query || {});
  const computed = crypto.createHmac('sha256', String(apiKey || '')).update(sorted).digest('hex');
  return { ok: provided === computed, computedLen: computed.length };
}

function verifyAyetClientSignature(details, apiKey) {
  const d = details || {};
  const externalIdentifier = String(d.externalIdentifier || '');
  const currency = String(d.currency ?? '');
  const conversionId = String(d.conversionId || '');
  const provided = String(d.signature || '').trim();
  const custom_1 = String(d.custom_1 || '');
  const custom_2 = String(d.custom_2 || '');
  const custom_3 = String(d.custom_3 || '');
  const custom_4 = String(d.custom_4 || '');
  const custom_5 = String(d.custom_5 || '');
  if (!externalIdentifier || !currency || !conversionId || !provided) return { ok: false, error: 'missing_fields' };
  const msg = externalIdentifier + currency + conversionId + custom_1 + custom_2 + custom_3 + custom_4 + custom_5;
  const computed = crypto.createHmac('sha1', String(apiKey || '')).update(msg).digest('hex');
  return { ok: computed === provided, computedLen: computed.length };
}

function buildLinkvertiseUrl(template, targetUrl) {
  if (!template) return '';

  const targetB64 = Buffer.from(targetUrl, 'utf8').toString('base64');
  if (template.includes('{target}')) return template.replace('{target}', encodeURIComponent(targetUrl));
  if (template.includes('{targetB64}')) return template.replace('{targetB64}', encodeURIComponent(targetB64));

  if (template.includes('dynamic?r=')) {
    const parts = template.split('r=');
    const prefix = parts[0] + 'r=';
    return prefix + encodeURIComponent(targetB64);
  }

  return template;
}

async function getLatestSession(userId, method) {
  return EarnSession.findOne({ userId, method }).sort({ createdAt: -1 });
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { getCache, setCache } = require('../lib/redis');
    const cacheKey = `earn:status:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const [settings, user] = await Promise.all([
      getSettings(),
      User.findById(userId).lean(),
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const cfg = getEarnConfig(settings);
    const publicCfg = JSON.parse(JSON.stringify(cfg || {}));
    if (publicCfg?.linkvertise) delete publicCfg.linkvertise.antiBypassToken;

    if (publicCfg?.ads) delete publicCfg.ads.ayetApiKey;

    if (publicCfg?.ads && !isAyetConfigured(settings)) {
      publicCfg.ads.enabled = false;
    }

    const dayStart = startOfUtcDay(new Date());
    const [adsToday, linkvertiseToday] = await Promise.all([
      EarnSession.countDocuments({ userId, method: 'ads', creditedAt: { $gte: dayStart } }),
      EarnSession.countDocuments({ userId, method: 'linkvertise', creditedAt: { $gte: dayStart } }),
    ]);

    const todayByMethod = { ads: adsToday, linkvertise: linkvertiseToday };

    const sessions = await EarnSession.find({ userId, method: { $in: METHOD_KEYS } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const latestByMethod = {};
    for (const s of sessions) {
      if (!latestByMethod[s.method]) latestByMethod[s.method] = s;
    }

    const now = Date.now();
    const status = {};

    for (const method of METHOD_KEYS) {
      const methodCfg = cfg[method];
      const session = latestByMethod[method] || null;

      let state = 'ready';
      let retryAfterSeconds = 0;
      let availableAt = null;
      let cooldownUntil = null;
      let remainingToday = null;
      let todayClaims = Number(todayByMethod[method] || 0);

      if (method === 'ads' && !isAyetConfigured(settings)) {
        state = 'disabled';
      } else if (!cfg.enabled || !methodCfg.enabled) {
        state = 'disabled';
      } else if (Number(methodCfg.maxClaimsPerDay || 0) <= 0) {
        state = 'limit_reached';
        remainingToday = 0;
      } else if (todayClaims >= Number(methodCfg.maxClaimsPerDay || 0)) {
        state = 'limit_reached';
        remainingToday = 0;
      } else if (session && session.status === 'started') {
        const exp = session.expiresAt ? new Date(session.expiresAt).getTime() : 0;
        const avail = session.availableAt ? new Date(session.availableAt).getTime() : 0;
        if (exp && exp < now) {
          state = 'expired';
        } else if (avail && now < avail) {
          state = 'waiting';
          retryAfterSeconds = Math.max(0, Math.ceil((avail - now) / 1000));
          availableAt = new Date(avail).toISOString();
        } else {
          if (method === 'ads') {
            const rewarded = Boolean(session?.meta?.ayetRewardedAt) || Boolean(session?.providerTxId);
            state = rewarded ? 'claimable' : 'waiting';
            availableAt = session.availableAt ? new Date(session.availableAt).toISOString() : null;
          } else {
            const hasAntiBypass = Boolean(String(cfg?.linkvertise?.antiBypassToken || '').trim());
            const verified = Boolean(session?.meta?.lvVerifiedAt);
            if (hasAntiBypass && !verified) {
              state = 'waiting';
              retryAfterSeconds = 0;
              availableAt = session.availableAt ? new Date(session.availableAt).toISOString() : null;
            } else {
              state = 'claimable';
              availableAt = session.availableAt ? new Date(session.availableAt).toISOString() : null;
            }
          }
        }
      } else if (session && session.status === 'completed') {
        const completedAt = session.completedAt ? new Date(session.completedAt).getTime() : 0;
        if (completedAt) {
          const until = completedAt + (Number(methodCfg.cooldownSeconds) * 1000);
          if (now < until) {
            state = 'cooldown';
            retryAfterSeconds = Math.max(0, Math.ceil((until - now) / 1000));
            cooldownUntil = new Date(until).toISOString();
          }
        }
      }

      if (remainingToday === null) {
        remainingToday = Math.max(0, Number(methodCfg.maxClaimsPerDay || 0) - todayClaims);
      }

      status[method] = {
        state,
        sessionId: session?._id ? String(session._id) : null,
        rewardCoins: session?.rewardCoins ?? methodCfg.coins,
        availableAt,
        cooldownUntil,
        retryAfterSeconds,
        todayClaims,
        maxClaimsPerDay: Number(methodCfg.maxClaimsPerDay || 0),
        remainingToday,
      };
    }

    const result = {
      coins: Number(user.coins || 0),
      config: publicCfg,
      status,
    };
    
    await setCache(cacheKey, result, 30);
    return res.json(result);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/ads/ayet/callback', async (req, res) => {
  try {
    const settings = await getSettings();
    const apiKey = String(settings?.earn?.ads?.ayetApiKey || '').trim();
    if (!apiKey) return res.status(200).send('ok');

    const verified = verifyAyetCallbackHmac(req, apiKey);
    if (!verified.ok) return res.status(200).send('bad');

    const sessionId = String(req.query.custom_1 || req.query.custom_1_sanitized || '').trim();
    const txId = String(req.query.transaction_id || req.query.transaction_id_sanitized || req.query.conversion_id || '').trim();
    if (!/^[0-9a-fA-F]{24}$/.test(sessionId) || !txId) return res.status(200).send('ok');

    const now = new Date();

    const updated = await EarnSession.findOneAndUpdate(
      { _id: sessionId, method: 'ads', status: 'started', expiresAt: { $gt: now }, providerTxId: null },
      {
        $set: {
          provider: 'ayet',
          providerTxId: txId,
          'meta.ayetRewardedAt': now,
          'meta.ayet': {
            payout_usd: req.query.payout_usd,
            amount: req.query.amount,
            currency_amount: req.query.currency_amount,
            adslot_id: req.query.adslot_id,
            placement_identifier: req.query.placement_identifier,
          },
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      const existing = await EarnSession.findOne({ _id: sessionId, method: 'ads' }).lean();
      if (existing?.providerTxId === txId) return res.status(200).send('ok');
      return res.status(200).send('ok');
    }

    return res.status(200).send('ok');
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return res.status(200).send('ok');
  }
});

router.post('/ads/ayet/rewarded', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const bodySchema = z.object({
      sessionId: z.string().min(1),
      details: z.record(z.any()),
    });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });

    const sessionId = String(parsed.data.sessionId || '').trim();
    if (!/^[0-9a-fA-F]{24}$/.test(sessionId)) return res.status(400).json({ error: 'Invalid sessionId' });

    const settings = await getSettings();
    const apiKey = String(settings?.earn?.ads?.ayetApiKey || '').trim();
    if (!apiKey) return res.status(403).json({ error: 'ayeT is not configured' });

    const details = parsed.data.details || {};
    const custom1 = String(details.custom_1 || '');
    if (custom1 && custom1 !== sessionId) return res.status(403).json({ error: 'Session mismatch' });

    const sigOk = verifyAyetClientSignature(details, apiKey);
    if (!sigOk.ok) return res.status(403).json({ error: 'Invalid ayet signature' });

    const conversionId = String(details.conversionId || '').trim();
    if (!conversionId) return res.status(400).json({ error: 'Missing conversionId' });

    const now = new Date();
    const updated = await EarnSession.findOneAndUpdate(
      { _id: sessionId, userId, method: 'ads', status: 'started', expiresAt: { $gt: now }, providerTxId: null },
      {
        $set: {
          provider: 'ayet',
          providerTxId: conversionId,
          'meta.ayetRewardedAt': now,
          'meta.ayetClient': {
            status: details.status,
            rewarded: details.rewarded,
            externalIdentifier: details.externalIdentifier,
            currency: details.currency,
            conversionId: details.conversionId,
            custom_1: details.custom_1,
            custom_2: details.custom_2,
            custom_3: details.custom_3,
            custom_4: details.custom_4,
            custom_5: details.custom_5,
          },
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      const existing = await EarnSession.findOne({ _id: sessionId, userId, method: 'ads' }).lean();
      if (existing?.providerTxId === conversionId) return res.json({ ok: true });
      return res.status(409).json({ error: 'Already verified' });
    }

    return res.json({ ok: true });
  } catch (e) {
    if (e && e.code === 11000) {
      return res.status(409).json({ error: 'Duplicate conversion' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/ads/admob/ssv', async (req, res) => {
  try {
    const verified = await verifyAdmobSsvFromRequest(req);
    if (!verified.ok) return res.status(400).send('bad');

    const sessionId = String(req.query.custom_data || '');
    const txId = String(req.query.transaction_id || '');
    if (!/^[0-9a-fA-F]{24}$/.test(sessionId) || !txId) return res.status(400).send('bad');

    const now = new Date();

    const updated = await EarnSession.findOneAndUpdate(
      {
        _id: sessionId,
        method: 'ads',
        status: 'started',
        expiresAt: { $gt: now },
        providerTxId: null,
      },
      {
        $set: {
          provider: 'admob',
          providerTxId: txId,
          meta: {
            ad_network: req.query.ad_network,
            ad_unit: req.query.ad_unit,
            reward_amount: req.query.reward_amount,
            reward_item: req.query.reward_item,
            timestamp: req.query.timestamp,
            transaction_id: req.query.transaction_id,
            user_id: req.query.user_id,
            custom_data: req.query.custom_data,
            key_id: req.query.key_id,
          },
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      const existing = await EarnSession.findOne({ _id: sessionId, method: 'ads' }).lean();
      if (existing?.providerTxId === txId) return res.status(200).send('ok');
      return res.status(409).send('conflict');
    }

    return res.status(200).send('ok');
  } catch (e) {
    if (e && e.code === 11000) {
      return res.status(409).send('conflict');
    }
    return res.status(500).send('error');
  }
});

router.post('/:method/start', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const paramsSchema = z.object({ method: z.enum(['ads', 'linkvertise']) });
    const parsedParams = paramsSchema.safeParse(req.params);
    if (!parsedParams.success) return res.status(400).json({ error: 'Invalid method' });

    const method = parsedParams.data.method;

    const settings = await getSettings();
    const cfg = getEarnConfig(settings);
    const methodCfg = cfg[method];

    if (method === 'ads' && !isAyetConfigured(settings)) {
      return res.status(403).json({ error: 'ayeT Rewarded Video is not configured' });
    }

    if (!cfg.enabled || !methodCfg.enabled) {
      return res.status(403).json({ error: 'Earn method is disabled' });
    }

    const dayStart = startOfUtcDay(new Date());
    const todayClaims = await EarnSession.countDocuments({ userId, method, creditedAt: { $gte: dayStart } });
    if (Number(methodCfg.maxClaimsPerDay || 0) <= 0 || Number(todayClaims) >= Number(methodCfg.maxClaimsPerDay || 0)) {
      return res.status(429).json({ error: 'Daily limit reached' });
    }

    const latest = await getLatestSession(userId, method);
    const now = Date.now();

    if (latest && latest.status === 'started') {
      const exp = latest.expiresAt ? new Date(latest.expiresAt).getTime() : 0;
      if (!exp || exp >= now) {
        const resumed = {
          session: {
            id: String(latest._id),
            method: latest.method,
            rewardCoins: Number(latest.rewardCoins || 0),
            availableAt: latest.availableAt,
            expiresAt: latest.expiresAt,
          }
        };

        if (method === 'ads') {
          resumed.ads = { provider: 'ayet', placementId: Number(cfg?.ads?.ayetPlacementId || 0), adslotName: String(cfg?.ads?.ayetAdslotName || '') };
        }

        if (method === 'linkvertise') {
          const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
          const target = `${base}/earn?lvSid=${encodeURIComponent(String(latest._id))}`;
          const url = buildLinkvertiseUrl(String(methodCfg.url || ''), target);
          const hasAntiBypass = Boolean(String(cfg?.linkvertise?.antiBypassToken || '').trim());
          resumed.linkvertise = hasAntiBypass ? { url, target } : { url, target, sessionSecret: String(latest.secret || '') };
        }

        return res.json(resumed);
      }
    }

    if (latest && latest.status === 'completed' && latest.completedAt) {
      const completedAt = new Date(latest.completedAt).getTime();
      const cooldownUntil = completedAt + (Number(methodCfg.cooldownSeconds) * 1000);
      if (now < cooldownUntil) {
        return res.status(429).json({
          error: 'Cooldown active',
          retryAfterSeconds: Math.max(0, Math.ceil((cooldownUntil - now) / 1000)),
          cooldownUntil: new Date(cooldownUntil).toISOString(),
        });
      }
    }

    const availableAt = new Date(now + (Number(methodCfg.waitSeconds) * 1000));
    const expiresAt = new Date(now + (Number(methodCfg.waitSeconds) * 1000) + (15 * 60 * 1000));

    const adsAvailableAt = method === 'ads' ? new Date(now) : availableAt;
    const adsExpiresAt = method === 'ads' ? new Date(now + (15 * 60 * 1000)) : expiresAt;

    const secret = crypto.randomBytes(16).toString('hex');

    const session = await EarnSession.create({
      userId,
      method,
      status: 'started',
      rewardCoins: Number(methodCfg.coins || 0),
      availableAt: adsAvailableAt,
      expiresAt: adsExpiresAt,
      secret,
      meta: {
        linkvertiseTemplate: method === 'linkvertise' ? String(methodCfg.url || '') : undefined,
      },
    });

    const response = {
      session: {
        id: String(session._id),
        method: session.method,
        rewardCoins: Number(session.rewardCoins || 0),
        availableAt: session.availableAt,
        expiresAt: session.expiresAt,
      },
    };

    if (method === 'ads') {
      response.ads = { provider: 'ayet', placementId: Number(cfg?.ads?.ayetPlacementId || 0), adslotName: String(cfg?.ads?.ayetAdslotName || '') };
    }

    if (method === 'linkvertise') {
      const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
      const target = `${base}/earn?lvSid=${encodeURIComponent(String(session._id))}`;
      const url = buildLinkvertiseUrl(String(methodCfg.url || ''), target);
      const hasAntiBypass = Boolean(String(cfg?.linkvertise?.antiBypassToken || '').trim());
      response.linkvertise = hasAntiBypass ? { url, target } : { url, target, sessionSecret: secret };
    }

    await writeAudit(req, 'earn.session.start', 'earn', String(session._id), {
      method,
      rewardCoins: Number(session.rewardCoins || 0),
      availableAt: session.availableAt,
      expiresAt: session.expiresAt,
    });

    const { deleteCachePattern } = require('../lib/redis');
    await deleteCachePattern(`earn:status:${userId}`);

    return res.json(response);
  } catch (e) {
    console.error('Earn start failed:', e?.message || e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:method/claim', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const paramsSchema = z.object({ method: z.enum(['ads', 'linkvertise']) });
    const parsedParams = paramsSchema.safeParse(req.params);
    if (!parsedParams.success) return res.status(400).json({ error: 'Invalid method' });

    const bodySchema = z.object({
      sessionId: z.string().min(1),
      secret: z.string().optional(),
      hash: z.string().optional(),
    });
    const parsedBody = bodySchema.safeParse(req.body);
    if (!parsedBody.success) return res.status(400).json({ error: 'Invalid payload', details: parsedBody.error.flatten() });

    const method = parsedParams.data.method;
    const sessionId = parsedBody.data.sessionId;

    const settings = await getSettings();
    const cfg = getEarnConfig(settings);
    const methodCfg = cfg[method];

    if (!cfg.enabled || !methodCfg.enabled) {
      return res.status(403).json({ error: 'Earn method is disabled' });
    }

    if (method === 'ads' && !isAyetConfigured(settings)) {
      return res.status(403).json({ error: 'ayeT Rewarded Video is not configured' });
    }

    const dayStart = startOfUtcDay(new Date());
    const todayClaims = await EarnSession.countDocuments({ userId, method, creditedAt: { $gte: dayStart } });
    if (Number(methodCfg.maxClaimsPerDay || 0) <= 0 || Number(todayClaims) >= Number(methodCfg.maxClaimsPerDay || 0)) {
      return res.status(429).json({ error: 'Daily limit reached' });
    }

    const now = new Date();
    const linkvertiseToken = method === 'linkvertise' ? String(cfg?.linkvertise?.antiBypassToken || '').trim() : '';
    let preSession = await EarnSession.findOne({ _id: sessionId, userId, method }).lean();
    if (!preSession) return res.status(404).json({ error: 'Session not found' });

    if (method === 'ads' && isAyetConfigured(settings)) {
      const ok = Boolean(preSession?.meta?.ayetRewardedAt) || Boolean(preSession?.providerTxId);
      if (!ok) return res.status(403).json({ error: 'Ad verification required' });
    }

    if (method === 'linkvertise' && linkvertiseToken) {
      const alreadyVerified = Boolean(preSession?.meta?.lvVerifiedAt);
      if (!alreadyVerified) {
        const hash = String(parsedBody.data.hash || '').trim();
        if (!hash) return res.status(403).json({ error: 'Missing Linkvertise hash' });
        const verified = await verifyLinkvertiseHash(linkvertiseToken, hash);
        if (!verified?.ok) {
          const reason = String(verified?.reason || '').slice(0, 160);
          return res.status(403).json({ error: 'Linkvertise verification failed', reason });
        }
        await EarnSession.updateOne(
          { _id: sessionId, userId, method },
          { $set: { 'meta.lvVerifiedAt': now, 'meta.lvHash': hash } }
        );
        preSession = await EarnSession.findOne({ _id: sessionId, userId, method }).lean();
      }
    }

    const txSession = await mongoose.startSession().catch(() => null);
    if (!txSession) {
      const existing = preSession;

      if (method === 'linkvertise' && !linkvertiseToken) {
        const provided = parsedBody.data.secret || '';
        if (!provided || provided !== String(existing.secret || '')) {
          return res.status(403).json({ error: 'Invalid or missing Linkvertise secret' });
        }
      }

      let completed = await EarnSession.findOneAndUpdate(
        {
          _id: sessionId,
          userId,
          method,
          status: 'started',
          availableAt: { $lte: now },
          expiresAt: { $gt: now },
        },
        { $set: { status: 'completed', completedAt: now } },
        { new: true }
      );

      if (!completed) {
        completed = await EarnSession.findOne({ _id: sessionId, userId, method });
        if (!completed) return res.status(404).json({ error: 'Session not found' });
        if (completed.status === 'started') return res.status(400).json({ error: 'Session is not claimable' });
        if (completed.status === 'expired') return res.status(400).json({ error: 'Session expired' });
      }

      const locked = await EarnSession.findOneAndUpdate(
        { _id: sessionId, userId, method, status: 'completed', creditedAt: null },
        { $set: { creditedAt: now } },
        { new: true }
      );

      if (!locked) return res.status(409).json({ error: 'Already claimed' });

      const reward = Number(locked.rewardCoins || 0);
      const userBefore = await User.findById(userId).lean();
      if (!userBefore) return res.status(404).json({ error: 'User not found' });
      const coinsBefore = Number(userBefore.coins || 0);
      const userAfter = await User.findByIdAndUpdate(userId, { $inc: { coins: reward } }, { new: true }).lean();
      if (!userAfter) return res.status(404).json({ error: 'User not found' });

      await writeAudit(req, 'earn.claim', 'earn', String(locked._id), {
        method,
        rewardCoins: reward,
        coinsBefore,
        coinsAfter: Number(userAfter.coins || 0),
        sessionId: String(locked._id),
      });

      const { deleteCachePattern } = require('../lib/redis');
      await deleteCachePattern(`earn:status:${userId}`);
      await deleteCachePattern(`user:${userId}:profile`);

      return res.json({ ok: true, coins: Number(userAfter.coins || 0), rewardCoins: reward });
    }

    let result = null;
    await txSession.withTransaction(async () => {
      const current = await EarnSession.findOne({ _id: sessionId, userId, method }).session(txSession);
      if (!current) throw new Error('NOT_FOUND');
      if (method === 'linkvertise') {
        if (linkvertiseToken) {
          if (!current?.meta?.lvVerifiedAt) throw new Error('LV_NOT_VERIFIED');
        } else {
          const provided = parsedBody.data.secret || '';
          if (!provided || provided !== String(current.secret || '')) throw new Error('BAD_SECRET');
        }
      }

      if (current.status === 'started') {
        const avail = current.availableAt ? new Date(current.availableAt) : null;
        const exp = current.expiresAt ? new Date(current.expiresAt) : null;
        if (avail && now < avail) throw new Error('NOT_READY');
        if (exp && now >= exp) {
          await EarnSession.updateOne({ _id: current._id, status: 'started' }, { $set: { status: 'expired' } }, { session: txSession });
          throw new Error('EXPIRED');
        }
        await EarnSession.updateOne({ _id: current._id, status: 'started' }, { $set: { status: 'completed', completedAt: now } }, { session: txSession });
      }

      if (current.status === 'expired') throw new Error('EXPIRED');

      const locked = await EarnSession.findOneAndUpdate(
        { _id: current._id, userId, method, status: 'completed', creditedAt: null },
        { $set: { creditedAt: now } },
        { new: true, session: txSession }
      );

      if (!locked) throw new Error('ALREADY');

      const reward = Number(locked.rewardCoins || 0);

      const user = await User.findById(userId).session(txSession);
      if (!user) throw new Error('NOUSER');
      const coinsBefore = Number(user.coins || 0);
      user.coins = coinsBefore + reward;
      await user.save({ session: txSession });

      result = {
        rewardCoins: reward,
        coinsBefore,
        coinsAfter: Number(user.coins || 0),
        sessionId: String(locked._id),
      };
    });
    txSession.endSession();

    if (!result) return res.status(500).json({ error: 'Internal server error' });

    await writeAudit(req, 'earn.claim', 'earn', String(result.sessionId), {
      method,
      rewardCoins: result.rewardCoins,
      coinsBefore: result.coinsBefore,
      coinsAfter: result.coinsAfter,
      sessionId: result.sessionId,
    });

    const { deleteCachePattern } = require('../lib/redis');
    await deleteCachePattern(`earn:status:${userId}`);
    await deleteCachePattern(`user:${userId}:profile`);

    return res.json({ ok: true, coins: result.coinsAfter, rewardCoins: result.rewardCoins });
  } catch (e) {
    if (String(e?.message || '') === 'ALREADY') return res.status(409).json({ error: 'Already claimed' });
    if (String(e?.message || '') === 'NOT_FOUND') return res.status(404).json({ error: 'Session not found' });
    if (String(e?.message || '') === 'BAD_SECRET') return res.status(403).json({ error: 'Invalid or missing Linkvertise secret' });
    if (String(e?.message || '') === 'LV_NOT_VERIFIED') return res.status(403).json({ error: 'Linkvertise verification required' });
    if (String(e?.message || '') === 'NOT_READY') return res.status(429).json({ error: 'Not ready yet' });
    if (String(e?.message || '') === 'EXPIRED') return res.status(400).json({ error: 'Session expired' });
    if (String(e?.message || '') === 'NOUSER') return res.status(404).json({ error: 'User not found' });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
