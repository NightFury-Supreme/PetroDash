const User = require('../../models/User');
const UserSession = require('../../models/UserSession');
const UserPlan = require('../../models/UserPlan');
const Server = require('../../models/Server');
const VerificationToken = require('../../models/VerificationToken');
const PendingDeletion = require('../../models/PendingDeletion');
const PendingUpdate = require('../../models/PendingUpdate');
const { deleteServer: deletePanelServer, deletePanelUser } = require('../../services/pterodactyl');
const { setCache, getOrSetCache, deleteCache, acquireLock, releaseLock } = require('../../lib/redis');
const { invalidateUserCaches, invalidateAdminUserListCaches } = require('../../utils/userCacheInvalidation');
const { invalidateServerCaches } = require('../../utils/serverCacheInvalidation');
const { sendMailTemplate } = require('../../lib/mail');
const bcrypt = require('bcryptjs');
const AppError = require('../../utils/AppError');
const { buildIdFilter, generatePublicId } = require('../../utils/publicId');
const profileSecurityService = require('./profile.security.service');

class ProfileAccountService {
  async getSessions(userId, currentSessionId) {
    const user = await User.findOne(buildIdFilter(userId)).select('_id publicId').lean();
    if (!user) return [];

    const cacheKey = `user:${user.publicId}:sessions`;
    const sessions = await getOrSetCache(
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

    return sessions.map((s) => {
      const isCurrent = s.id === currentSessionId;
      return { ...s, current: isCurrent };
    });
  }

  async revokeSession(userId, id, currentSessionId) {
    const user = await User.findOne(buildIdFilter(userId)).select('_id publicId').lean();
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const lockToken = await acquireLock(`user:mutation:${user.publicId}`, 5000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
    }
    try {
      const session = await UserSession.findOne({ ...buildIdFilter(id), userId: user._id }).select('publicId').lean();
      if (!session) throw AppError.notFound('Session not found', 'ERR_NOT_FOUND');
      const pubId = session.publicId;
      if (pubId === currentSessionId) {
        throw AppError.badRequest('Cannot revoke current session', 'ERR_CANNOT_REVOKE_CURRENT');
      }
      await UserSession.deleteOne({ _id: session._id });
      await Promise.all([
        deleteCache(`session:valid:${session.publicId}`),
        setCache(`session:valid:${session.publicId}`, false, 3600),
        deleteCache(`user:${user.publicId}:sessions`),
      ]).catch(() => {});
      return true;
    } finally {
      await releaseLock(`user:mutation:${user.publicId}`, lockToken);
    }
  }

  async deleteAccount(userId, password, tfaCode) {
    const user = await User.findOne(buildIdFilter(userId)).select('+passwordHash +tfaSecret +tfaBackupCodes');
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const lockToken = await acquireLock(`user:mutation:${user.publicId}`, 15000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
    }
    try {
      if (user.passwordHash) {
        if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
          throw AppError.badRequest('Invalid password', 'ERR_INVALID_PASSWORD');
        }
      }

      if (user.tfaEnabled) {
        if (!tfaCode) throw AppError.badRequest('2FA required', 'ERR_2FA_REQUIRED');
        if (!profileSecurityService.verifyUserTfaCode(user, tfaCode, false)) {
          throw AppError.badRequest('Invalid 2FA code', 'ERR_2FA_INVALID');
        }
      }

      const servers = await Server.find({ owner: user._id }).select('panelServerId eggId locationId publicId').lean();
      for (const server of servers) {
        if (server.panelServerId) {
          try {
            await deletePanelServer(server.panelServerId);
          } catch {
            await PendingDeletion.create({ resourceType: 'server', panelId: server.panelServerId }).catch(() => {});
          }
        }
        await Server.deleteOne({ _id: server._id });
      }

      if (user.pterodactylUserId) {
        try {
          await deletePanelUser(user.pterodactylUserId);
        } catch {
          await PendingDeletion.create({ resourceType: 'user', panelId: user.pterodactylUserId }).catch(() => {});
        }
        await PendingUpdate.deleteMany({ pterodactylUserId: user.pterodactylUserId }).catch(() => {});
      }

      const sessions = await UserSession.find({ userId: user._id }).select('publicId').lean();
      await Promise.all([
        User.deleteOne({ _id: user._id }),
        UserPlan.deleteMany({ userId: user._id }),
        UserSession.deleteMany({ userId: user._id }),
        VerificationToken.deleteMany({ userId: user._id }),
        ...sessions.flatMap((session) => [
          deleteCache(`session:valid:${session.publicId}`),
          setCache(`session:valid:${session.publicId}`, false, 3600),
        ]),
        invalidateUserCaches(user.publicId),
        invalidateAdminUserListCaches(),
        ...servers.map((s) =>
          invalidateServerCaches({
            userId: user.publicId,
            publicServerId: s.publicId,
            eggId: s.eggId ? String(s.eggId) : null,
            locationId: s.locationId ? String(s.locationId) : null,
          })
        ),
      ]);

      await sendMailTemplate({
        to: user.email,
        templateKey: 'accountDeleted',
        data: { username: user.username },
      }).catch(() => {});

      return { username: user.username, email: user.email, serversDeleted: servers.length };
    } finally {
      await releaseLock(`user:mutation:${user.publicId}`, lockToken);
    }
  }
}

module.exports = new ProfileAccountService();
