const User = require('../../../models/User');
const UserSession = require('../../../models/UserSession');
const AppError = require('../../../utils/AppError');
const { buildIdFilter, isValidEntityId } = require('../../../utils/publicId');
const { acquireLock, releaseLock, getOrSetCache, deleteCache, setCache } = require('../../../lib/redis');
const { writeAudit } = require('../../../middleware/audit');

const getUserSessions = async (id) => {
  if (!isValidEntityId(String(id), 'user')) {
    throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
  }

  const user = await User.findOne(buildIdFilter(id)).select('_id publicId').lean();
  if (!user) {
    throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
  }

  const cacheKey = `admin:user:${user.publicId}:sessions`;
  return getOrSetCache(
    cacheKey,
    async () => {
      const rawSessions = await UserSession.find({ userId: user._id })
        .select('device deviceType browser ip location lastActive createdAt publicId')
        .sort({ lastActive: -1 })
        .lean();

      return rawSessions.map((s) => ({
        id: s.publicId,
        device: s.device || 'Unknown Device',
        deviceType: s.deviceType || 'desktop',
        browser: s.browser || 'Unknown Browser',
        ip: s.ip || 'Unknown IP',
        location: s.location || 'Unknown Location',
        lastActive: s.lastActive,
        createdAt: s.createdAt,
      }));
    },
    15
  );
};

const revokeUserSession = async (req, id, sessionId) => {
  if (!isValidEntityId(String(id), 'user')) {
    throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
  }

  const lockToken = await acquireLock(`user:mutation:${id}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }

  try {
    const user = await User.findOne(buildIdFilter(id)).select('_id publicId').lean();
    if (!user) {
      throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
    }

    const session = await UserSession.findOne({ ...buildIdFilter(sessionId), userId: user._id })
      .select('publicId')
      .lean();

    if (!session) {
      throw AppError.notFound('Session not found', 'ERR_SESSION_NOT_FOUND');
    }

    const pubId = session.publicId;
    await UserSession.deleteOne({ publicId: session.publicId });

    await Promise.all([
      deleteCache(`session:valid:${pubId}`),
      setCache(`session:valid:${pubId}`, false, 3600),
      deleteCache(`admin:user:${user.publicId}:sessions`),
      deleteCache(`user:${user.publicId}:sessions`),
    ]).catch(() => {});

    const actor = {
      adminId: req.user?.sub || req.user?.userId,
      adminUsername: req.user?.username,
      adminRole: req.user?.role || 'admin',
    };

    await writeAudit(req, 'admin.user.session.revoke', 'user', user.publicId, {
      revokedSessionId: pubId,
      targetUserId: user.publicId,
      ...actor,
    });

    return { success: true };
  } finally {
    await releaseLock(`user:mutation:${id}`, lockToken);
  }
};

const revokeAllUserSessions = async (req, id) => {
  if (!isValidEntityId(String(id), 'user')) {
    throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
  }

  const lockToken = await acquireLock(`user:mutation:${id}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }

  try {
    const user = await User.findOne(buildIdFilter(id)).select('_id publicId').lean();
    if (!user) {
      throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
    }

    const sessions = await UserSession.find({ userId: user._id }).select('publicId').lean();
    await UserSession.deleteMany({ userId: user._id });

    await Promise.all([
      ...sessions.flatMap((s) => [
        deleteCache(`session:valid:${s.publicId}`),
        setCache(`session:valid:${s.publicId}`, false, 3600),
      ]),
      deleteCache(`admin:user:${user.publicId}:sessions`),
      deleteCache(`user:${user.publicId}:sessions`),
    ]).catch(() => {});

    const actor = {
      adminId: req.user?.sub || req.user?.userId,
      adminUsername: req.user?.username,
      adminRole: req.user?.role || 'admin',
    };

    await writeAudit(req, 'admin.user.sessions.revoke_all', 'user', user.publicId, {
      revokedCount: sessions.length,
      targetUserId: user.publicId,
      ...actor,
    });

    return { success: true, count: sessions.length };
  } finally {
    await releaseLock(`user:mutation:${id}`, lockToken);
  }
};

module.exports = {
  getUserSessions,
  revokeUserSession,
  revokeAllUserSessions,
};
