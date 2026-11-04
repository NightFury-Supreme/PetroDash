const User = require('../../models/User');
const { deleteCache, acquireLock, releaseLock } = require('../../lib/redis');
const { invalidateUserCaches } = require('../../utils/userCacheInvalidation');
const AppError = require('../../utils/AppError');
const { buildIdFilter } = require('../../utils/publicId');
const { syncPanelUser } = require('./profile.sync.service');
const profileSecurityService = require('./profile.security.service');
const profileAccountService = require('./profile.account.service');

class ProfileService {
  async checkUsernameAvailability(username) {
    if (!username) return false;
    const user = await User.findOne({ username }).select('_id').lean();
    return !user;
  }

  async invalidateUserCaches(userId) {
    await invalidateUserCaches(userId);
  }

  async syncPanelUser(user) {
    return syncPanelUser(user);
  }

  async updateProfile(userId, { username, firstName, lastName }) {
    const lockToken = await acquireLock(`user:mutation:${userId}`, 5000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
    }
    try {
      const user = await User.findOne(buildIdFilter(userId));
      if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

      if (username && username !== user.username) {
        const exists = await User.findOne({ username }).select('_id').lean();
        if (exists) throw AppError.badRequest('Username already in use', 'ERR_USERNAME_IN_USE');
      }

      const oldValues = { username: user.username, firstName: user.firstName, lastName: user.lastName };
      if (username !== undefined) user.username = username;
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;

      await user.save();
      await this.invalidateUserCaches(user.publicId);
      if (username || firstName || lastName) await this.syncPanelUser(user);

      return {
        user,
        changes: {
          old: oldValues,
          new: { username: user.username, firstName: user.firstName, lastName: user.lastName },
        },
      };
    } finally {
      await releaseLock(`user:mutation:${userId}`, lockToken);
    }
  }

  verifyUserTfaCode(user, code, consumeBackup = false) {
    return profileSecurityService.verifyUserTfaCode(user, code, consumeBackup);
  }

  initiateEmailChange(userId, newEmail) {
    return profileSecurityService.initiateEmailChange(userId, newEmail);
  }

  verifyEmailChange(userId, newEmail, code) {
    return profileSecurityService.verifyEmailChange(userId, newEmail, code);
  }

  updatePassword(userId, currentPassword, newPassword, tfaCode) {
    return profileSecurityService.updatePassword(userId, currentPassword, newPassword, tfaCode);
  }

  setup2FA(userId) {
    return profileSecurityService.setup2FA(userId);
  }

  verify2FA(userId, secret, code) {
    return profileSecurityService.verify2FA(userId, secret, code);
  }

  disable2FA(userId, password, code) {
    return profileSecurityService.disable2FA(userId, password, code);
  }

  getSessions(userId, currentSessionId) {
    return profileAccountService.getSessions(userId, currentSessionId);
  }

  revokeSession(userId, id, currentSessionId) {
    return profileAccountService.revokeSession(userId, id, currentSessionId);
  }

  deleteAccount(userId, password, tfaCode) {
    return profileAccountService.deleteAccount(userId, password, tfaCode);
  }
}

const profileService = new ProfileService();

module.exports = profileService;
module.exports.profileService = profileService;
