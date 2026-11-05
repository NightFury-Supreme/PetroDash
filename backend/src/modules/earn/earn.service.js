const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../../models/User');
const EarnSession = require('../../models/EarnSession');
const { getSettings } = require('../../lib/settings');
const { getCache, setCache, deleteCache, acquireLock, releaseLock } = require('../../lib/redis');
const { invalidateUserCaches } = require('../../utils/userCacheInvalidation');
const AppError = require('../../utils/AppError');
const { buildIdFilter } = require('../../utils/publicId');
const { METHOD_KEYS } = require('./earn.schema');
const { buildLinkvertiseUrl, verifyLinkvertiseHash } = require('./earn.linkvertise');
const { startOfUtcDay, clampInt, getEarnConfig } = require('./earn.config');

class EarnService {
  startOfUtcDay(d = new Date()) {
    return startOfUtcDay(d);
  }

  clampInt(value, min, max, fallback) {
    return clampInt(value, min, max, fallback);
  }

  getEarnConfig(settings) {
    return getEarnConfig(settings);
  }

  async getStatus(userId) {
    const cacheKey = `earn:status:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const [settings, user] = await Promise.all([
      getSettings(),
      User.findOne(buildIdFilter(userId)).lean(),
    ]);

    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const cfg = this.getEarnConfig(settings) || {};
    const { antiBypassToken: _token, ...cleanLinkvertise } = cfg.linkvertise || {};
    const publicCfg = {
      ...cfg,
      ...(cfg.linkvertise ? { linkvertise: cleanLinkvertise } : {}),
    };

    const dayStart = this.startOfUtcDay(new Date());
    const userQuery = { $in: [user._id, user.publicId] };

    const linkvertiseToday = await EarnSession.countDocuments({
      userId: userQuery,
      method: 'linkvertise',
      creditedAt: { $gte: dayStart },
    });

    const todayByMethod = { linkvertise: linkvertiseToday };
    const sessions = await EarnSession.find({ userId: userQuery, method: { $in: METHOD_KEYS } })
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
      const methodCfg = cfg[method] || {};
      const session = latestByMethod[method] || null;

      let state = 'ready';
      let retryAfterSeconds = 0;
      let availableAt = null;
      let cooldownUntil = null;
      const todayClaims = Number(todayByMethod[method] || 0);
      const maxDaily = Number(methodCfg.maxClaimsPerDay || 0);
      const remainingToday = Math.max(0, maxDaily - todayClaims);

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
            const hasAntiBypass = Boolean(method === 'linkvertise' && methodCfg.antiBypassToken);
            const isVerified = Boolean(session.meta?.lvVerifiedAt);

            if (hasAntiBypass && !isVerified) {
              state = 'in_progress';
            } else {
              state = 'claimable';
            }
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
        sessionId: (state === 'waiting' || state === 'in_progress' || state === 'claimable') ? (session?.publicId || null) : null,
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
    return out;
  }

  async startSession(userId, method, targetUrl = null) {
    const safeMethod = String(method) === 'linkvertise' ? 'linkvertise' : null;
    if (!safeMethod) {
      throw AppError.badRequest('Invalid earn method', 'ERR_EARN_INVALID_METHOD');
    }

    const cleanUserId = String(userId || '').trim();
    const user = await User.findOne(buildIdFilter(cleanUserId)).lean();
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const lockKey = `earn:start:${user.publicId}`;
    const lockToken = await acquireLock(lockKey, 5000);
    if (!lockToken) {
      throw AppError.tooManyRequests('Earn session start in progress', 'ERR_EARN_COOLDOWN_ACTIVE');
    }

    try {
      const settings = await getSettings();
      const cfg = this.getEarnConfig(settings);
      const mCfg = cfg[safeMethod];

      if (!mCfg || !mCfg.enabled) {
        throw AppError.badRequest('Earn method is currently disabled', 'ERR_EARN_METHOD_DISABLED');
      }

      const dayStart = this.startOfUtcDay(new Date());
      const userFilter = { userId: user._id, method: safeMethod };
      const [todayCount, latest] = await Promise.all([
        EarnSession.countDocuments({ ...userFilter, creditedAt: { $gte: dayStart } }),
        EarnSession.findOne(userFilter).sort({ createdAt: -1 }),
      ]);

      const maxDaily = Number(mCfg.maxClaimsPerDay || 0);
      if (todayCount >= maxDaily) {
        throw AppError.badRequest('Daily claim limit reached', 'ERR_EARN_DAILY_LIMIT_REACHED');
      }

      const buildTargetWithSid = (sid) => {
        const base = targetUrl && typeof targetUrl === 'string' && targetUrl.trim()
          ? targetUrl.trim()
          : `${(process.env.FRONTEND_URL || '').replace(/\/+$/, '')}/earn`;
        return base.includes('?') ? `${base}&lvSid=${sid}` : `${base}?lvSid=${sid}`;
      };

      const now = Date.now();
      if (latest) {
        if (latest.status === 'started') {
          const exp = latest.expiresAt ? new Date(latest.expiresAt).getTime() : 0;
          if (now < exp) {
            const out = { sessionId: latest.publicId, status: 'started' };
            if (method === 'linkvertise' && mCfg.url) {
              out.linkvertise = { url: buildLinkvertiseUrl(mCfg.url, buildTargetWithSid(latest.publicId)) };
            }
            return out;
          }
        }
        if (latest.status === 'completed' && latest.creditedAt) {
          const cred = new Date(latest.creditedAt).getTime();
          const cool = Number(mCfg.cooldownSeconds || 0) * 1000;
          if (now < cred + cool) {
            throw AppError.badRequest('Cooldown is active. Please wait.', 'ERR_EARN_COOLDOWN_ACTIVE');
          }
        }
      }

      const wait = Number(mCfg.waitSeconds || 0) * 1000;
      const avail = now + wait;
      const exp = avail + 6 * 60 * 60 * 1000;
      const secret = crypto.randomBytes(16).toString('hex');

      const session = await EarnSession.create({
        userId: user._id,
        method,
        status: 'started',
        rewardCoins: mCfg.coins,
        startedAt: new Date(now),
        availableAt: new Date(avail),
        expiresAt: new Date(exp),
        secret,
      });

      await Promise.all([
        deleteCache(`earn:status:${user.publicId}`),
        deleteCache(`earn:status:${user._id}`),
      ]);

      const out = { sessionId: session.publicId, status: 'started' };
      if (method === 'linkvertise' && mCfg.url) {
        out.linkvertise = { url: buildLinkvertiseUrl(mCfg.url, buildTargetWithSid(session.publicId)) };
      }
      return out;
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }

  async claimSession(userId, method, { sessionId, hash, secret }) {
    const safeMethod = String(method) === 'linkvertise' ? 'linkvertise' : null;
    if (!safeMethod) {
      throw AppError.badRequest('Invalid earn method', 'ERR_EARN_INVALID_METHOD');
    }

    const cleanSessionId = String(sessionId || '').trim();
    if (!cleanSessionId || !isValidEntityId(cleanSessionId, 'earnSession')) {
      throw AppError.badRequest('Invalid earn sessionId', 'ERR_EARN_INVALID_SESSION');
    }

    const cleanUserId = String(userId || '').trim();
    const user = await User.findOne(buildIdFilter(cleanUserId)).lean();
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const lockKey = `earn:claim:${user.publicId}:${cleanSessionId}`;
    const lockToken = await acquireLock(lockKey, 5000);
    if (!lockToken) {
      throw AppError.tooManyRequests('Reward claim already in progress', 'ERR_EARN_CLAIM_FAILED');
    }

    try {
      const now = new Date();
      const current = await EarnSession.findOne({ publicId: cleanSessionId, userId: user._id, method: safeMethod });
      if (!current) throw AppError.notFound('Earn session not found', 'ERR_EARN_SESSION_NOT_FOUND');

      if (safeMethod === 'linkvertise' && hash) {
        const settings = await getSettings();
        const cfg = this.getEarnConfig(settings);
        const token = cfg.linkvertise?.antiBypassToken;
        if (token) {
          if (current.status !== 'started') {
            throw AppError.badRequest('Earn session is not active', 'ERR_EARN_SESSION_NOT_ACTIVE');
          }
          const avail = current.availableAt ? new Date(current.availableAt) : null;
          if (avail && now < avail) {
            throw AppError.badRequest('Session is not ready yet', 'ERR_EARN_NOT_READY');
          }

          const v = await verifyLinkvertiseHash(token, hash);
          if (!v.ok) {
            throw AppError.badRequest(`Linkvertise verification failed: ${v.reason}`, 'ERR_EARN_VERIFICATION_FAILED');
          }
          await EarnSession.updateOne({ _id: current._id }, { $set: { 'meta.lvVerifiedAt': now } });
        }
      }

      let result = null;
      const db = mongoose.connection;
      const txSession = await db.startSession();

      try {
        await txSession.withTransaction(async () => {
          const sess = await EarnSession.findOne({ publicId: cleanSessionId, userId: user._id, method: safeMethod })
            .select('+secret')
            .session(txSession);
          if (!sess) throw AppError.notFound('Earn session was not found', 'ERR_EARN_SESSION_NOT_FOUND');

          if (safeMethod === 'linkvertise') {
            const settings = await getSettings();
            const cfg = this.getEarnConfig(settings);
            const linkvertiseToken = cfg.linkvertise?.antiBypassToken;
            if (linkvertiseToken) {
              if (!sess?.meta?.lvVerifiedAt) {
                throw AppError.badRequest('Linkvertise verification failed or incomplete', 'ERR_EARN_LV_NOT_VERIFIED');
              }
            } else {
              const provided = secret || '';
              if (!provided || provided !== String(sess.secret || '')) {
                throw AppError.badRequest('Invalid earn session secret', 'ERR_EARN_BAD_SECRET');
              }
            }
          }

          if (sess.status === 'started') {
            const avail = sess.availableAt ? new Date(sess.availableAt) : null;
            const exp = sess.expiresAt ? new Date(sess.expiresAt) : null;
            if (avail && now < avail) throw AppError.badRequest('Earn session is not ready yet', 'ERR_EARN_NOT_READY');
            if (exp && now >= exp) {
              await EarnSession.updateOne({ _id: sess._id, status: 'started' }, { $set: { status: 'expired' } }, { session: txSession });
              throw AppError.badRequest('Earn session has expired', 'ERR_EARN_EXPIRED');
            }
            await EarnSession.updateOne({ _id: sess._id, status: 'started' }, { $set: { status: 'completed', completedAt: now } }, { session: txSession });
          }

          if (sess.status === 'expired') throw AppError.badRequest('Earn session has expired', 'ERR_EARN_EXPIRED');

          const locked = await EarnSession.findOneAndUpdate(
            { _id: sess._id, status: 'completed', creditedAt: null },
            { $set: { creditedAt: now } },
            { new: true, session: txSession }
          );

          if (!locked) throw AppError.badRequest('This reward has already been claimed', 'ERR_EARN_ALREADY_CLAIMED');

          const reward = Number(locked.rewardCoins || 0);
          const updatedUser = await User.findOneAndUpdate(
            buildIdFilter(user.publicId),
            { $inc: { coins: reward } },
            { new: true, session: txSession }
          );
          if (!updatedUser) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

          result = {
            ok: true,
            rewardCoins: reward,
            coinsBefore: updatedUser.coins - reward,
            coinsAfter: updatedUser.coins,
            coins: updatedUser.coins,
            sessionId: locked.publicId,
            method,
          };
        });
      } finally {
        await txSession.endSession();
      }

      await Promise.all([
        deleteCache(`earn:status:${user.publicId}`),
        deleteCache(`earn:status:${user._id}`),
        invalidateUserCaches(user.publicId),
      ]);

      return result;
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }
}

module.exports = new EarnService();
