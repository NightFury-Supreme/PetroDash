/**
 * Earn Service Layer
 * Business logic for earning mechanisms, session tracking, and atomic coin distributions.
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../../models/User');
const EarnSession = require('../../models/EarnSession');
const { getSettings } = require('../../lib/settings');
const { getCache, setCache, deleteCachePattern } = require('../../lib/redis');
const AppError = require('../../utils/AppError');
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
      User.findById(userId).lean(),
    ]);

    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const cfg = this.getEarnConfig(settings);
    const publicCfg = JSON.parse(JSON.stringify(cfg || {}));
    if (publicCfg?.linkvertise) delete publicCfg.linkvertise.antiBypassToken;

    const dayStart = this.startOfUtcDay(new Date());
    const linkvertiseToday = await EarnSession.countDocuments({
      userId,
      method: 'linkvertise',
      creditedAt: { $gte: dayStart },
    });

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
    return out;
  }

  async startSession(userId, method, targetUrl = 'https://google.com') {
    if (!METHOD_KEYS.includes(method)) throw AppError.badRequest('Invalid earn method', 'ERR_EARN_INVALID_METHOD');

    const settings = await getSettings();
    const cfg = this.getEarnConfig(settings);
    const mCfg = cfg[method];

    if (!mCfg || !mCfg.enabled) throw AppError.badRequest('Earn method is currently disabled', 'ERR_EARN_METHOD_DISABLED');

    const dayStart = this.startOfUtcDay(new Date());
    const [todayCount, latest] = await Promise.all([
      EarnSession.countDocuments({ userId, method, creditedAt: { $gte: dayStart } }),
      EarnSession.findOne({ userId, method }).sort({ createdAt: -1 }),
    ]);

    const maxDaily = Number(mCfg.maxClaimsPerDay || 0);
    if (todayCount >= maxDaily) {
      throw AppError.badRequest('Daily claim limit reached', 'ERR_EARN_DAILY_LIMIT_REACHED');
    }

    const now = Date.now();
    if (latest) {
      if (latest.status === 'started') {
        const exp = latest.expiresAt ? new Date(latest.expiresAt).getTime() : 0;
        if (now < exp) {
          const out = { sessionId: String(latest._id), status: 'started' };
          if (method === 'linkvertise' && mCfg.url) {
            out.linkvertise = { url: buildLinkvertiseUrl(mCfg.url, targetUrl) };
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
      userId,
      method,
      status: 'started',
      rewardCoins: mCfg.coins,
      startedAt: new Date(now),
      availableAt: new Date(avail),
      expiresAt: new Date(exp),
      secret,
    });

    await deleteCachePattern(`earn:status:${userId}`);

    const out = { sessionId: String(session._id), status: 'started' };
    if (method === 'linkvertise' && mCfg.url) {
      out.linkvertise = { url: buildLinkvertiseUrl(mCfg.url, targetUrl) };
    }
    return out;
  }

  async claimSession(userId, method, { sessionId, hash, secret }) {
    if (!METHOD_KEYS.includes(method)) throw AppError.badRequest('Invalid earn method', 'ERR_EARN_INVALID_METHOD');

    const now = new Date();
    const current = await EarnSession.findOne({ _id: sessionId, userId, method });
    if (!current) throw AppError.notFound('Earn session not found', 'ERR_EARN_SESSION_NOT_FOUND');

    if (method === 'linkvertise' && hash) {
      const settings = await getSettings();
      const cfg = this.getEarnConfig(settings);
      const token = cfg.linkvertise?.antiBypassToken;
      if (token) {
        if (current.status !== 'started') throw AppError.badRequest('Earn session is not active', 'ERR_EARN_SESSION_NOT_ACTIVE');
        const avail = current.availableAt ? new Date(current.availableAt) : null;
        if (avail && now < avail) throw AppError.badRequest('Session is not ready yet', 'ERR_EARN_NOT_READY');

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
        const sess = await EarnSession.findOne({ _id: sessionId, userId, method }).session(txSession);
        if (!sess) throw AppError.notFound('Earn session was not found', 'ERR_EARN_SESSION_NOT_FOUND');

        if (method === 'linkvertise') {
          const settings = await getSettings();
          const cfg = this.getEarnConfig(settings);
          const linkvertiseToken = cfg.linkvertise?.antiBypassToken;
          if (linkvertiseToken) {
            if (!sess?.meta?.lvVerifiedAt) throw AppError.badRequest('Linkvertise verification failed or incomplete', 'ERR_EARN_LV_NOT_VERIFIED');
          } else {
            const provided = secret || '';
            if (!provided || provided !== String(sess.secret || '')) throw AppError.badRequest('Invalid earn session secret', 'ERR_EARN_BAD_SECRET');
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
          { _id: sess._id, userId, method, status: 'completed', creditedAt: null },
          { $set: { creditedAt: now } },
          { new: true, session: txSession }
        );

        if (!locked) throw AppError.badRequest('This reward has already been claimed', 'ERR_EARN_ALREADY_CLAIMED');

        const reward = Number(locked.rewardCoins || 0);
        const user = await User.findOneAndUpdate(
          { _id: userId },
          { $inc: { coins: reward } },
          { new: true, session: txSession }
        );
        if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

        result = {
          rewardCoins: reward,
          coinsBefore: user.coins - reward,
          coinsAfter: user.coins,
          sessionId: String(locked._id),
          method,
        };
      });
    } catch (e) {
      if (e.message === 'NOT_READY') throw AppError.badRequest('Session not ready', 'ERR_EARN_NOT_READY');
      if (e.message === 'EXPIRED') throw AppError.badRequest('Session expired', 'ERR_EARN_EXPIRED');
      if (e.message === 'ALREADY') throw AppError.badRequest('Already claimed', 'ERR_EARN_ALREADY_CLAIMED');
      if (e.message === 'LV_NOT_VERIFIED') throw AppError.badRequest('Linkvertise verification required', 'ERR_EARN_LV_NOT_VERIFIED');
      if (e.message === 'BAD_SECRET') throw AppError.badRequest('Invalid secret', 'ERR_EARN_BAD_SECRET');
      if (e.message === 'NOT_FOUND') throw AppError.notFound('Session not found', 'ERR_EARN_SESSION_NOT_FOUND');
      throw AppError.internal('Failed to claim session', 'ERR_EARN_CLAIM_FAILED');
    } finally {
      await txSession.endSession();
    }

    await deleteCachePattern(`earn:status:${userId}`);
    return result;
  }
}

module.exports = new EarnService();
