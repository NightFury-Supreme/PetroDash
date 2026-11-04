const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const { getCache, setCache } = require('../lib/redis');
const { buildIdFilter } = require('../utils/publicId');
const AppError = require('../utils/AppError');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(AppError.unauthorized('Unauthorized', 'ERR_UNAUTHORIZED'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = payload;

    const userId = payload?.sub || payload?.userId || null;
    if (!userId) return next(AppError.unauthorized('Unauthorized', 'ERR_UNAUTHORIZED'));

    const cacheKey = `user:auth:${userId}`;
    let u = await getCache(cacheKey);
    if (!u) {
      u = await User.findOne(buildIdFilter(userId)).select('_id ban role username publicId').lean();
      if (u) {
        await setCache(cacheKey, { ...u, _id: String(u._id) }, 60);
      }
    }

    if (!u) return next(AppError.unauthorized('Unauthorized', 'ERR_UNAUTHORIZED'));

    req.user = {
      ...payload,
      id: u.publicId,
      sub: u.publicId,
      userId: u.publicId,
      publicId: u.publicId,
      role: u.role || payload?.role || 'user',
      username: u.username || payload?.username || '',
    };

    const ban = u.ban || {};
    const active = Boolean(ban.isBanned) && (!ban.until || new Date(ban.until) > new Date());

    if (active) {
      return next(
        AppError.forbidden('Account banned', 'ERR_ACCOUNT_BANNED', {
          reason: String(ban.reason || ''),
          until: ban.until || null,
          username: u.username || payload?.username || '',
        })
      );
    }

    if (!payload.sessionId) {
      return next(AppError.unauthorized('Session revoked', 'ERR_SESSION_REVOKED'));
    }

    const sessionCacheKey = `session:valid:${payload.sessionId}`;
    const isSessionValid = await getCache(sessionCacheKey);

    if (isSessionValid === null) {
      const sessionDoc = await UserSession.findOne(buildIdFilter(payload.sessionId))
        .select('publicId userId')
        .lean();

      if (!sessionDoc || String(sessionDoc.userId) !== String(u._id)) {
        await setCache(sessionCacheKey, false, 3600);
        return next(AppError.unauthorized('Session revoked', 'ERR_SESSION_REVOKED'));
      }

      await Promise.all([
        setCache(sessionCacheKey, true, 300),
        sessionDoc.publicId && sessionDoc.publicId !== payload.sessionId
          ? setCache(`session:valid:${sessionDoc.publicId}`, true, 300)
          : Promise.resolve(),
      ]).catch(() => {});

      UserSession.updateOne({ publicId: sessionDoc.publicId }, { $set: { lastActive: new Date() } }).catch(() => {});
    } else if (isSessionValid === false) {
      return next(AppError.unauthorized('Session revoked', 'ERR_SESSION_REVOKED'));
    }

    next();
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Unauthorized', 'ERR_UNAUTHORIZED'));
    }
    return next(AppError.internal('Internal server error', 'ERR_INTERNAL_SERVER'));
  }
}

async function requireAdmin(req, res, next) {
  await requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (req.user?.role !== 'admin') {
      return next(AppError.forbidden('Forbidden', 'ERR_FORBIDDEN'));
    }
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
