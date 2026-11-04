const User = require('../../../models/User');
const { isValidPublicId } = require('../../../utils/publicId');
const AppError = require('../../../utils/AppError');
const { writeAudit } = require('../../../middleware/audit');
const avatarService = require('../../../services/avatarService');
const { acquireLock, releaseLock } = require('../../../lib/redis');

async function uploadUserAvatar(req, id) {
  if (!isValidPublicId(id, 'user')) {
    throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  }

  const lockToken = await acquireLock(`user:mutation:${id}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }

  try {
    const user = await User.findOne({ publicId: String(id) });
    if (!user) {
      throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
    }

    if (!req.file || !req.file.buffer) {
      throw AppError.badRequest('No image file uploaded', 'ERR_UPLOAD_NO_FILE');
    }

    const oldPicture = user.profilePicture;
    const localPath = await avatarService.processAndSaveAvatar(req.file.buffer, user.publicId);
    user.profilePicture = localPath;
    await user.save();

    const publicUserId = user.publicId;
    const changes = { profilePicture: { old: oldPicture || null, new: localPath } };
    await writeAudit(req, 'admin.user.avatar_upload', 'user', publicUserId, {
      targetUserId: publicUserId,
      changes,
    });

    await avatarService.invalidateUserAvatarCaches(publicUserId);

    return { ok: true, code: 'USER_AVATAR_UPLOADED', profilePicture: localPath };
  } finally {
    await releaseLock(`user:mutation:${id}`, lockToken);
  }
}

async function resetUserAvatar(req, id) {
  if (!isValidPublicId(id, 'user')) {
    throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  }

  const lockToken = await acquireLock(`user:mutation:${id}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }

  try {
    const user = await User.findOne({ publicId: String(id) });
    if (!user) {
      throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
    }

    const oldPicture = user.profilePicture;
    const localPath = await avatarService.resetAvatarToGravatar(user);

    const publicUserId = user.publicId;
    const changes = { profilePicture: { old: oldPicture || null, new: localPath } };
    await writeAudit(req, 'admin.user.avatar_reset', 'user', publicUserId, {
      targetUserId: publicUserId,
      changes,
    });

    await avatarService.invalidateUserAvatarCaches(publicUserId);

    return { ok: true, code: 'USER_AVATAR_RESET', profilePicture: localPath };
  } finally {
    await releaseLock(`user:mutation:${id}`, lockToken);
  }
}

module.exports = {
  uploadUserAvatar,
  resetUserAvatar,
};
