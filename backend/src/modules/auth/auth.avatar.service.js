const User = require('../../models/User');
const { acquireLock, releaseLock } = require('../../lib/redis');
const { writeAudit } = require('../../middleware/audit');
const { logUserActivity } = require('../../middleware/userActivity');
const { buildIdFilter } = require('../../utils/publicId');
const AppError = require('../../utils/AppError');
const avatarService = require('../../services/avatarService');

async function uploadProfilePicture(req) {
  const lockToken = await acquireLock(`user:mutation:${req.user.sub}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }
  try {
    const user = await User.findOne(buildIdFilter(req.user.sub));
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
    if (!req.file || !req.file.buffer) {
      throw AppError.badRequest('No image file provided', 'ERR_UPLOAD_NO_FILE');
    }

    const oldPicture = user.profilePicture;
    const localPath = await avatarService.processAndSaveAvatar(req.file.buffer, user.publicId);
    user.profilePicture = localPath;
    await user.save();

    const changes = { profilePicture: { old: oldPicture || null, new: localPath } };
    await logUserActivity(req, 'auth.account.upload_picture', {
      changes,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    await writeAudit(req, 'auth.account.upload_picture', 'user_profile', user.publicId, {
      changes,
    });

    await avatarService.invalidateUserAvatarCaches(user.publicId);

    return { ok: true, code: 'PROFILE_PICTURE_UPLOADED', profilePicture: localPath };
  } finally {
    await releaseLock(`user:mutation:${req.user.sub}`, lockToken);
  }
}

async function syncOAuthAvatar(req, { provider } = {}) {
  const lockToken = await acquireLock(`user:mutation:${req.user.sub}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }
  try {
    const user = await User.findOne(buildIdFilter(req.user.sub));
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    let effectiveProvider = provider;
    if (!effectiveProvider) {
      if (user.oauthProviders?.discord?.id && user.oauthProviders.discord.avatar) {
        effectiveProvider = 'discord';
      } else if (user.oauthProviders?.google?.picture) {
        effectiveProvider = 'google';
      } else {
        effectiveProvider = 'gravatar';
      }
    }

    if (!effectiveProvider) {
      throw AppError.badRequest('No linked account or email available for avatar sync', 'ERR_NO_OAUTH_LINKED');
    }

    const oldPicture = user.profilePicture;
    const localPath = await avatarService.syncOAuthAvatar(user, effectiveProvider);

    const changes = { profilePicture: { old: oldPicture || null, new: localPath } };
    await logUserActivity(req, 'auth.account.sync_oauth_picture', {
      provider: effectiveProvider,
      changes,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    await writeAudit(req, 'auth.account.sync_oauth_picture', 'user_profile', user.publicId, {
      provider: effectiveProvider,
      changes,
    });

    await avatarService.invalidateUserAvatarCaches(user.publicId);

    return { ok: true, code: 'PROFILE_PICTURE_SYNCED', profilePicture: localPath };
  } finally {
    await releaseLock(`user:mutation:${req.user.sub}`, lockToken);
  }
}

async function resetProfilePicture(req) {
  const lockToken = await acquireLock(`user:mutation:${req.user.sub}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }
  try {
    const user = await User.findOne(buildIdFilter(req.user.sub));
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const oldPicture = user.profilePicture;
    const localPath = await avatarService.resetAvatarToGravatar(user);

    const changes = { profilePicture: { old: oldPicture || null, new: localPath } };
    await logUserActivity(req, 'auth.account.reset_picture', {
      changes,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    await writeAudit(req, 'auth.account.reset_picture', 'user_profile', user.publicId, {
      changes,
    });

    await avatarService.invalidateUserAvatarCaches(user.publicId);

    return { ok: true, code: 'PROFILE_PICTURE_RESET', profilePicture: localPath };
  } finally {
    await releaseLock(`user:mutation:${req.user.sub}`, lockToken);
  }
}

module.exports = {
  uploadProfilePicture,
  syncOAuthAvatar,
  resetProfilePicture,
};
