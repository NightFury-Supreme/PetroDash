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
const { logUserActivity } = require('../middleware/userActivity');

const router = express.Router();

const earnRateLimiter = createRateLimiter(120, 15 * 60 * 1000);
router.use(earnRateLimiter);

const METHOD_KEYS = ['linkvertise'];

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
    if (typeof data === 'string') return data.substring(0, 50);
    if (data && typeof data === 'object') {
      const parts = [];
      if (data.response) parts.push(String(data.response));
      if (data.message) parts.push(String(data.message));
      if (data.error) parts.push(String(data.error));
      if (data.result) parts.push(String(data.result));
      if (data.data && typeof data.data === 'string') parts.push(String(data.data));
      if (parts.length > 0) return parts.join(' | ').substring(0, 100);
      return JSON.stringify(data).substring(0, 100);
    }
    return String(data);
  };

  try {
    const p1 = axios.get(baseUrl, {
      params: { token: t, hash: h },
      headers: { ...baseHeaders, 'Accept': 'application/json' },
      timeout: 8000
    });
    
    const p2 = axios.post(baseUrl, { token: t, hash: h }, {
      headers: { ...baseHeaders, 'Accept': 'application/json', 'Content-Type': 'application/json' },
      timeout: 8000
    });
    
    const p3 = axios.post(baseUrl, `token=${encodeURIComponent(t)}&hash=${encodeURIComponent(h)}`, {
      headers: { ...baseHeaders, 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 8000
    });

    const results = await Promise.allSettled([p1, p2, p3]);
    let bestReason = 'verification failed';
    let anyNotFound = false;

    for (const r of results) {
      if (r.status === 'fulfilled') {
        const d = r.value.data;
        if (isTruthy(d)) {
          return { ok: true, reason: 'verified' };
        }
        
        const m = msgVerdict(d?.response || d?.message || d?.error || d?.result);
        if (m) {
          if (m.ok) return m;
          if (m.reason.includes('not found')) anyNotFound = true;
          bestReason = m.reason;
        } else {
          bestReason = summarizeData(d);
        }
      } else {
        const e = r.reason;
        if (e.response && e.response.data) {
          const d = e.response.data;
          if (isTruthy(d)) return { ok: true, reason: 'verified' };
          
          const m = msgVerdict(d?.response || d?.message || d?.error || d?.result);
          if (m) {
            if (m.ok) return m;
            if (m.reason.includes('not found')) anyNotFound = true;
            bestReason = m.reason;
          }
        }
      }
    }
    
    if (anyNotFound) return { ok: false, reason: 'hash not found' };
    return { ok: false, reason: bestReason };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
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

function getEarnConfig(s) {
  const earn = s?.earn || {};

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
    };
  };

  return {
    linkvertise: normalizeMethod(earn.linkvertise, { coins: 20, cooldownSeconds: 3600, waitSeconds: 10, maxClaimsPerDay: 24, url: '', antiBypassToken: '' }),
  };
}

function buildLinkvertiseUrl(template, targetUrl) {
  if (!template) return '';
  
  let url = template
    .replace(/\?o=sharing/g, '')
    .replace(/&o=sharing/g, '')
    .replace(/\/+$/, '');
    
  if (url.includes('/dynamic')) {
    url = url.split('/dynamic')[0];
  }
  
  const targetB64 = Buffer.from(targetUrl, 'utf8').toString('base64');
  const encodedTargetB64 = encodeURIComponent(targetB64);
  
  return url + '/dynamic?r=' + encodedTargetB64 + '&o=sharing';
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

    const dayStart = startOfUtcDay(new Date());
    const linkvertiseToday = await EarnSession.countDocuments({ userId, method: 'linkvertise', creditedAt: { $gte: dayStart } });

    const todayByMethod = { linkvertise: linkvertiseToday };

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

      const maxDaily = Number(methodCfg.maxClaimsPerDay || 0);
      remainingToday = Math.max(0, maxDaily - todayClaims);

      if (remainingToday <= 0) {
        state = 'limit_reached';
        cooldownUntil = new Date(dayStart.getTime() + 86400000).toISOString();
      } else if (session) {
        if (session.status === 'started') {
          const avail = session.availableAt ? new Date(session.availableAt).getTime() : 0;
          const exp = session.expiresAt ? new Date(session.expiresAt).getTime() : 0;
          
          if (now < avail) {
            state = 'waiting';
            retryAfterSeconds = Math.ceil((avail - now) / 1000);
            availableAt = new Date(avail).toISOString();
          } else if (now < exp) {
            state = 'claimable';
            availableAt = new Date(avail).toISOString();
          } else {
            state = 'ready';
          }
        } else if (session.status === 'completed') {
          const cred = session.creditedAt ? new Date(session.creditedAt).getTime() : 0;
          const cool = Number(methodCfg.cooldownSeconds || 0) * 1000;
          if (cred > 0 && cool > 0) {
            const nextTime = cred + cool;
            if (now < nextTime) {
              state = 'cooldown';
              retryAfterSeconds = Math.ceil((nextTime - now) / 1000);
              cooldownUntil = new Date(nextTime).toISOString();
            }
          }
        }
      }

      status[method] = {
        state,
        sessionId: state === 'waiting' || state === 'claimable' ? String(session?._id || '') : null,
        retryAfterSeconds: Math.max(0, retryAfterSeconds),
        availableAt,
        cooldownUntil,
        remainingToday,
        maxDaily,
        todayClaims,
      };
    }

    const out = { config: publicCfg, status, userCoins: Number(user.coins || 0) };
    await setCache(cacheKey, out, 15);
    return res.json(out);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load earn status' });
  }
});

const startSchema = z.object({
  targetUrl: z.string().url().max(2048).optional(),
});

router.post('/:method/start', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub;
    const { method } = req.params;
    if (!METHOD_KEYS.includes(method)) return res.status(400).json({ error: 'Invalid method' });

    const parsedBody = startSchema.safeParse(req.body || {});
    if (!parsedBody.success) return res.status(400).json({ error: 'Invalid payload' });

    const settings = await getSettings();
    const cfg = getEarnConfig(settings);
    const mCfg = cfg[method];

    if (!mCfg || !mCfg.enabled) return res.status(400).json({ error: 'Method disabled' });

    const dayStart = startOfUtcDay(new Date());
    const [todayCount, latest] = await Promise.all([
      EarnSession.countDocuments({ userId, method, creditedAt: { $gte: dayStart } }),
      EarnSession.findOne({ userId, method }).sort({ createdAt: -1 })
    ]);

    const maxDaily = Number(mCfg.maxClaimsPerDay || 0);
    if (todayCount >= maxDaily) {
      return res.status(400).json({ error: 'Daily limit reached', code: 'LIMIT_REACHED' });
    }

    const now = Date.now();
    if (latest) {
      if (latest.status === 'started') {
        const exp = latest.expiresAt ? new Date(latest.expiresAt).getTime() : 0;
        if (now < exp) {
          const out = { sessionId: String(latest._id), status: 'started' };
          if (method === 'linkvertise' && mCfg.url) {
            const targetUrl = parsedBody.data.targetUrl || 'https://google.com';
            out.linkvertise = { url: buildLinkvertiseUrl(mCfg.url, targetUrl) };
          }
          return res.json(out);
        }
      }
      if (latest.status === 'completed' && latest.creditedAt) {
        const cred = new Date(latest.creditedAt).getTime();
        const cool = Number(mCfg.cooldownSeconds || 0) * 1000;
        if (now < cred + cool) {
          return res.status(400).json({ error: 'Cooldown active', code: 'COOLDOWN' });
        }
      }
    }

    const wait = Number(mCfg.waitSeconds || 0) * 1000;
    const avail = now + wait;
    const exp = avail + (6 * 60 * 60 * 1000); 
    const secret = crypto.randomBytes(16).toString('hex');

    const session = await EarnSession.create({
      userId,
      method,
      status: 'started',
      rewardCoins: mCfg.coins,
      startedAt: new Date(now),
      availableAt: new Date(avail),
      expiresAt: new Date(exp),
      secret
    });

    const { deleteCachePattern } = require('../lib/redis');
    deleteCachePattern(`earn:status:${userId}`);
    logUserActivity(req, 'earn.start', `Started earn session via ${method}`);

    const out = { sessionId: String(session._id), status: 'started' };

    if (method === 'linkvertise' && mCfg.url) {
      const targetUrl = parsedBody.data.targetUrl || 'https://google.com';
      out.linkvertise = { url: buildLinkvertiseUrl(mCfg.url, targetUrl) };
    }

    return res.json(out);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return res.status(500).json({ error: 'Failed to start session' });
  }
});

const claimSchema = z.object({
  sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  hash: z.string().max(2048).optional(),
  secret: z.string().max(128).optional(),
});

router.post('/:method/claim', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub;
    const { method } = req.params;
    if (!METHOD_KEYS.includes(method)) return res.status(400).json({ error: 'Invalid method' });

    const parsedBody = claimSchema.safeParse(req.body);
    if (!parsedBody.success) return res.status(400).json({ error: 'Invalid payload' });

    const { sessionId, hash } = parsedBody.data;
    const now = new Date();

    const current = await EarnSession.findOne({ _id: sessionId, userId, method });
    if (!current) return res.status(404).json({ error: 'Session not found' });

    if (method === 'linkvertise' && hash) {
      const settings = await getSettings();
      const cfg = getEarnConfig(settings);
      const token = cfg.linkvertise?.antiBypassToken;
      if (token) {
        if (current.status !== 'started') {
          return res.status(400).json({ error: 'Session not active' });
        }
        
        const avail = current.availableAt ? new Date(current.availableAt) : null;
        if (avail && now < avail) {
          return res.status(400).json({ error: 'Not ready yet', code: 'NOT_READY' });
        }

        const v = await verifyLinkvertiseHash(token, hash);
        if (!v.ok) {
          return res.status(400).json({ error: `Linkvertise verification failed: ${v.reason}` });
        }
        await EarnSession.updateOne({ _id: current._id }, { $set: { 'meta.lvVerifiedAt': now } });
      }
    }

    let result = null;
    const db = mongoose.connection;
    const txSession = await db.startSession();

    await txSession.withTransaction(async () => {
      const current = await EarnSession.findOne({ _id: sessionId, userId, method }).session(txSession);
      if (!current) throw new Error('NOT_FOUND');
      if (method === 'linkvertise') {
        const settings = await getSettings();
        const cfg = getEarnConfig(settings);
        const linkvertiseToken = cfg.linkvertise?.antiBypassToken;
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

      const user = await User.findOneAndUpdate(
        { _id: userId },
        { $inc: { coins: reward } },
        { new: true, session: txSession }
      );
      if (!user) throw new Error('NOUSER');

      result = {
        rewardCoins: reward,
        coinsBefore: user.coins - reward,
        coinsAfter: user.coins,
        sessionId: String(locked._id),
      };
    });

    await txSession.endSession();

    const { deleteCachePattern } = require('../lib/redis');
    deleteCachePattern(`earn:status:${userId}`);
    logUserActivity(req, 'earn.claim', `Claimed ${result.rewardCoins} coins via ${method}`);

    return res.json(result);
  } catch (e) {
    if (e.message === 'NOT_READY') return res.status(400).json({ error: 'Session not ready', code: 'NOT_READY' });
    if (e.message === 'EXPIRED') return res.status(400).json({ error: 'Session expired', code: 'EXPIRED' });
    if (e.message === 'ALREADY') return res.status(400).json({ error: 'Already claimed', code: 'ALREADY' });
    if (e.message === 'LV_NOT_VERIFIED') return res.status(400).json({ error: 'Hash verification required' });
    if (e.message === 'BAD_SECRET') return res.status(400).json({ error: 'Invalid secret' });
    return res.status(500).json({ error: 'Failed to claim session' });
  }
});

module.exports = router;
