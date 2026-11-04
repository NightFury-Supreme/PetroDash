const mongoose = require('mongoose');
const User = require('../../../models/User');
const UserSession = require('../../../models/UserSession');
const Server = require('../../../models/Server');
const VerificationToken = require('../../../models/VerificationToken');
const PendingDeletion = require('../../../models/PendingDeletion');
const UserPlan = require('../../../models/UserPlan');
const AppError = require('../../../utils/AppError');
const { deleteServer: deletePanelServer, deletePanelUser } = require('../../../services/pterodactyl');
const { deleteCache, acquireLock, releaseLock } = require('../../../lib/redis');
const { invalidateUserCaches, invalidateAdminUserListCaches } = require('../../../utils/userCacheInvalidation');
const { invalidateServerCaches } = require('../../../utils/serverCacheInvalidation');
const { sendMailTemplate } = require('../../../lib/mail');
const { writeAudit } = require('../../../middleware/audit');
const { isValidEntityId, buildIdFilter } = require('../../../utils/publicId');

async function invalidateTargetUserCaches(targetUserId) {
  await Promise.all([
    invalidateUserCaches(targetUserId),
    invalidateAdminUserListCaches(),
  ]);
}

const getAdminActor = (req) => ({
  adminId: req?.user?.sub,
  adminUsername: req?.user?.username || 'admin',
  adminRole: req?.user?.role || 'admin',
});

const deleteUser = async (req, id) => {
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
    if (user.publicId === req.user?.sub) {
      throw AppError.forbidden('Cannot delete your own admin account', 'ERR_ADMIN_SELF_DELETE');
    }

    const servers = await Server.find({ owner: user._id });
    let deletedServers = 0;
    let pendingServerDeletions = 0;

    for (const server of servers) {
      if (server.panelServerId) {
        try {
          await deletePanelServer(server.panelServerId);
        } catch (_panelError) {
          pendingServerDeletions++;
          await PendingDeletion.create({ resourceType: 'server', panelId: server.panelServerId }).catch(() => {});
        }
      }
      await Server.deleteOne({ _id: server._id });
      deletedServers++;
    }

    let pendingUserDeletion = false;
    if (user.pterodactylUserId) {
      try {
        await deletePanelUser(user.pterodactylUserId);
      } catch (_panelError) {
        pendingUserDeletion = true;
        await PendingDeletion.create({ resourceType: 'user', panelId: user.pterodactylUserId }).catch(() => {});
      }
    }

    const sessions = await UserSession.find({ userId: user._id }).select('publicId').lean();

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await User.deleteOne({ _id: user._id }, { session });
        await UserSession.deleteMany({ userId: user._id }, { session });
        await VerificationToken.deleteMany({ userId: user._id }, { session });
        await UserPlan.deleteMany({ userId: user._id }, { session });
      });
    } finally {
      await session.endSession();
    }

    await Promise.all(sessions.map((s) => deleteCache(`session:valid:${s.publicId}`)));

    if (user.email) {
      await sendMailTemplate({
        to: user.email,
        templateKey: 'accountDeletedByAdmin',
        data: { username: user.username },
      }).catch(() => {});
    }

    const actor = getAdminActor(req);
    const publicUserId = user.publicId;
    const auditPayload = {
      serversDeleted: deletedServers,
      pendingServerDeletions,
      pendingUserDeletion,
      ...actor,
    };
    await writeAudit(req, 'admin.user.delete', 'user', publicUserId, {
      targetUserId: publicUserId,
      targetUsername: user.username,
      targetEmail: user.email,
      ...auditPayload,
    });

    await invalidateTargetUserCaches(publicUserId);
    await Promise.all(
      servers.map((s) =>
        invalidateServerCaches({
          userId: publicUserId,
          publicServerId: s.publicId,
          eggId: s.eggId ? String(s.eggId) : null,
          locationId: s.locationId ? String(s.locationId) : null,
        })
      )
    );

    return {
      ok: true,
      success: true,
      code: 'SUCCESS_USER_DELETED',
      serversDeleted: deletedServers,
      totalServers: servers.length,
      pendingCleanup: pendingServerDeletions > 0 || pendingUserDeletion,
    };
  } finally {
    await releaseLock(`user:mutation:${id}`, lockToken);
  }
};

module.exports = { deleteUser };
