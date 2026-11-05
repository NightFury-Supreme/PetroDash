const User = require('../../../models/User');
const AppError = require('../../../utils/AppError');
const { buildIdFilter, isValidEntityId } = require('../../../utils/publicId');
const { acquireLock, releaseLock, deleteCache } = require('../../../lib/redis');
const { invalidateUserCaches } = require('../../../utils/userCacheInvalidation');
const { writeAudit } = require('../../../middleware/audit');

const invalidateUserDetailCaches = async (user) => {
  const pubId = user.publicId;
  const tasks = [
    deleteCache(`admin:users:detail:${pubId}:1:10`),
    deleteCache(`admin:user:${pubId}:sessions`),
    invalidateUserCaches(pubId),
  ];
  await Promise.all(tasks).catch(() => {});
};

const resetUser2FA = async (req, id) => {
  if (!isValidEntityId(String(id), 'user')) {
    throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
  }

  const lockToken = await acquireLock(`user:mutation:${id}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }

  try {
    const user = await User.findOne(buildIdFilter(id)).select('+tfaSecret +tfaBackupCodes');
    if (!user) {
      throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
    }

    user.tfaEnabled = false;
    user.tfaSecret = null;
    user.tfaBackupCodes = [];
    await user.save();

    await Promise.all([
      deleteCache(`2fa:pending:${user.publicId}`),
    ]).catch(() => {});

    await invalidateUserDetailCaches(user);

    const actor = {
      adminId: req.user?.sub || req.user?.userId,
      adminUsername: req.user?.username,
      adminRole: req.user?.role || 'admin',
    };

    await writeAudit(req, 'admin.user.2fa.reset', 'user', user.publicId, {
      targetUserId: user.publicId,
      ...actor,
    });

    return {
      success: true,
      tfaEnabled: false,
    };
  } finally {
    await releaseLock(`user:mutation:${id}`, lockToken);
  }
};

const verifyUserEmail = async (req, id, payload = {}) => {
  if (!isValidEntityId(String(id), 'user')) {
    throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
  }

  const lockToken = await acquireLock(`user:mutation:${id}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }

  try {
    const user = await User.findOne(buildIdFilter(id));
    if (!user) {
      throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
    }

    const verified = typeof payload.verified === 'boolean' ? payload.verified : !user.emailVerified;
    user.emailVerified = verified;
    await user.save();

    await invalidateUserDetailCaches(user);

    const actor = {
      adminId: req.user?.sub || req.user?.userId,
      adminUsername: req.user?.username,
      adminRole: req.user?.role || 'admin',
    };

    await writeAudit(req, 'admin.user.email.verify', 'user', user.publicId, {
      verified,
      targetUserId: user.publicId,
      ...actor,
    });

    return {
      success: true,
      emailVerified: verified,
    };
  } finally {
    await releaseLock(`user:mutation:${id}`, lockToken);
  }
};

module.exports = {
  resetUser2FA,
  verifyUserEmail,
};
