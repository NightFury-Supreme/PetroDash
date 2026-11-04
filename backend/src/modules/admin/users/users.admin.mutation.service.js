const User = require('../../../models/User');
const Server = require('../../../models/Server');
const PendingUpdate = require('../../../models/PendingUpdate');
const AppError = require('../../../utils/AppError');
const { checkUserExists, updatePanelUser, suspendServer, unsuspendServer } = require('../../../services/pterodactyl');
const { deleteCache, acquireLock, releaseLock, publishEvent } = require('../../../lib/redis');
const { invalidateUserCaches, invalidateAdminUserListCaches } = require('../../../utils/userCacheInvalidation');
const { invalidateServerCaches } = require('../../../utils/serverCacheInvalidation');
const { sendMailTemplate } = require('../../../lib/mail');
const { writeAudit } = require('../../../middleware/audit');
const { isValidEntityId, buildIdFilter, formatPublicEntity } = require('../../../utils/publicId');

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

const updateUser = async (req, id, data) => {
  if (!isValidEntityId(String(id), 'user')) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');

  const lockToken = await acquireLock(`user:mutation:${id}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }

  try {
    const user = await User.findOne(buildIdFilter(id));
    if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');

    const isSelf = user.publicId === req.user?.sub;
    if (isSelf && data?.role && data.role !== 'admin') throw new AppError('You cannot demote your own admin role.', 403, 'ERR_ADMIN_SELF_DEMOTE');
    if (isSelf && data?.ban?.isBanned === true) throw new AppError('You cannot ban your own account.', 403, 'ERR_ADMIN_SELF_BAN');

    const originalUser = user.toObject();
    const { role, resources, coins, email, username, firstName, lastName, referralCode, ban, emailVerified } = data;

    if (role) user.role = role;
    if (typeof coins === 'number') user.coins = coins;
    if (typeof emailVerified === 'boolean') user.emailVerified = emailVerified;
    if (resources) user.resources = { ...(user.resources || {}), ...resources };

    const oldEmail = user.email;
    const oldUsername = user.username;
    const emailChanged = email && email !== oldEmail;
    const usernameChanged = username && username !== oldUsername;

    if (emailChanged) {
      const existing = await User.findOne({ email }).lean();
      if (existing) throw new AppError('Email already in use by another user.', 409, 'ERR_EMAIL_IN_USE');
    }
    if (usernameChanged) {
      const existing = await User.findOne({ username }).lean();
      if (existing) throw new AppError('Username already in use by another user.', 409, 'ERR_USERNAME_IN_USE');
    }
    if (emailChanged || usernameChanged) {
      const pterodactylCheck = await checkUserExists(email || oldEmail, username || oldUsername, user.pterodactylUserId);
      if (pterodactylCheck.emailExists) throw new AppError('Email already exists in Pterodactyl panel.', 409, 'ERR_PTERO_EMAIL_EXISTS');
      if (pterodactylCheck.usernameExists) throw new AppError('Username already exists in Pterodactyl panel.', 409, 'ERR_PTERO_USERNAME_EXISTS');
    }

    if (emailChanged) user.email = email;
    if (usernameChanged) user.username = username;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    if (typeof referralCode === 'string') {
      const desired = referralCode.trim().toUpperCase();
      const exists = await User.findOne({ referralCode: desired }).lean();
      if (exists && exists.publicId !== user.publicId) {
        throw new AppError('Referral code is already in use by another user.', 409, 'ERR_REFERRAL_CODE_IN_USE');
      }
      user.referralCode = desired;
    }

    if (ban && typeof ban === 'object') {
      if (!user.ban) user.ban = {};
      const untilDate = ban.until === null ? null : (ban.until ? new Date(ban.until) : user.ban.until || null);
      user.ban.isBanned = typeof ban.isBanned === 'boolean' ? ban.isBanned : Boolean(user.ban.isBanned);
      if (typeof ban.reason === 'string') user.ban.reason = ban.reason;
      user.ban.until = untilDate;
      user.ban.by = req.user?.sub || req.user?.userId || user.ban.by || null;
    }
    await user.save();

    if (user.pterodactylUserId) {
      const payload = { email: user.email, username: user.username, first_name: user.firstName, last_name: user.lastName };
      try {
        await updatePanelUser(user.pterodactylUserId, payload);
      } catch (_updateErr) {
        await PendingUpdate.create({ pterodactylUserId: user.pterodactylUserId, payload: JSON.stringify(payload) }).catch(() => {});
      }
    }

    if (user.email && user.ban?.isBanned && !originalUser.ban?.isBanned) {
      await sendMailTemplate({
        to: user.email,
        templateKey: 'accountBanned',
        data: { username: user.username, reason: user.ban?.reason || '', until: user.ban?.until ? new Date(user.ban.until).toISOString() : 'lifetime' },
      }).catch(() => {});
    }

    const changes = {};
    const simpleFields = {
      role,
      coins: typeof coins === 'number' ? coins : undefined,
      email: emailChanged ? email : undefined,
      username: usernameChanged ? username : undefined,
      firstName,
      lastName,
      referralCode: user.referralCode !== originalUser.referralCode ? user.referralCode : undefined,
      emailVerified: typeof emailVerified === 'boolean' ? emailVerified : undefined,
    };
    for (const [k, v] of Object.entries(simpleFields)) {
      if (v !== undefined && v !== originalUser[k]) changes[k] = { old: originalUser[k], new: v };
    }

    if (resources) {
      for (const [k, v] of Object.entries(resources)) {
        const oldVal = (originalUser.resources || {})[k] || 0;
        if (v !== oldVal) changes[k] = { old: oldVal, new: v };
      }
    }

    if (ban) {
      if (ban.isBanned !== undefined && ban.isBanned !== (originalUser.ban?.isBanned || false)) {
        changes['ban.isBanned'] = { old: originalUser.ban?.isBanned || false, new: ban.isBanned };
      }
      if (ban.reason !== undefined && ban.reason !== (originalUser.ban?.reason || '')) {
        changes['ban.reason'] = { old: originalUser.ban?.reason || '', new: ban.reason };
      }
      const oldTime = originalUser.ban?.until ? new Date(originalUser.ban.until).getTime() : null;
      const newTime = user.ban?.until ? new Date(user.ban.until).getTime() : null;
      if (ban.until !== undefined && oldTime !== newTime) {
        changes['ban.until'] = { old: originalUser.ban?.until || null, new: user.ban?.until };
      }
    }

    const actor = getAdminActor(req);
    const publicUserId = user.publicId;

    await writeAudit(req, 'admin.user.update', 'user', publicUserId, {
      changes,
      targetUserId: publicUserId,
      targetUsername: user.username,
      targetEmail: user.email,
      ...actor,
    });

    await invalidateTargetUserCaches(publicUserId);
    const safeUser = await User.findById(user._id, { passwordHash: 0, tfaSecret: 0, tfaBackupCodes: 0 }).lean();
    return { user: formatPublicEntity(safeUser, 'user') };
  } finally {
    await releaseLock(`user:mutation:${id}`, lockToken);
  }
};

const banUser = async (req, id, { isBanned, reason, durationMinutes }) => {
  if (!isValidEntityId(String(id), 'user')) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');

  const lockToken = await acquireLock(`user:mutation:${id}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Operation in progress, please retry', 'ERR_CONCURRENT_TRANSACTION');
  }

  try {
    const user = await User.findOne(buildIdFilter(id));
    if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');

    if (!user.ban) user.ban = {};
    const requesterId = req.user?.sub;
    if (isBanned && requesterId === user.publicId) {
      throw AppError.badRequest('ERR_ADMIN_SELF_BAN');
    }

    user.ban.isBanned = Boolean(isBanned);
    user.ban.reason = isBanned ? (reason || '') : '';
    if (isBanned && durationMinutes != null) {
      const until = new Date();
      until.setMinutes(until.getMinutes() + Number(durationMinutes || 0));
      user.ban.until = until;
    } else {
      user.ban.until = null;
    }
    user.ban.by = requesterId || null;

    const servers = await Server.find({ owner: user._id, panelServerId: { $exists: true, $ne: null } }).lean();
    for (const s of servers) {
      if (!s.panelServerId) continue;
      try {
        if (isBanned) await suspendServer(s.panelServerId);
        else await unsuspendServer(s.panelServerId);
      } catch (panelError) {
        await writeAudit(requesterId, isBanned ? 'server.suspend_failed' : 'server.unsuspend_failed', 'server', s.publicId || String(s.panelServerId), {
          error: panelError.message,
          panelServerId: s.panelServerId,
        }).catch(() => {});
      }
    }

    if (isBanned) {
      await Server.updateMany(
        { owner: user._id },
        { $set: { status: 'suspended', suspended: true, suspendedUntil: null, suspensionReason: 'account_banned' } }
      );
    } else {
      await Server.updateMany(
        { owner: user._id, suspensionReason: 'account_banned' },
        { $set: { status: 'active', suspended: false, suspendedUntil: null, suspensionReason: null } }
      );
    }

    for (const s of servers) {
      await invalidateServerCaches({ userId: user.publicId, publicServerId: s.publicId }).catch(() => {});
      await publishEvent(`user:${user.publicId}:servers`, {
        type: isBanned ? 'SERVER_UPDATED' : 'SERVER_ACTIVE',
        serverId: s.publicId,
      }).catch(() => {});
    }

    await user.save();

    if (isBanned && user.email) {
      await sendMailTemplate({
        to: user.email,
        templateKey: 'accountBanned',
        data: { username: user.username, reason: user.ban.reason || '', until: user.ban.until ? user.ban.until.toISOString() : 'lifetime' },
      }).catch(() => {});
    }

    const actor = getAdminActor(req);
    const publicBannedUserId = user.publicId;

    if (isBanned) {
      const banMeta = {
        reason: user.ban.reason || null,
        banUntil: user.ban.until ? user.ban.until.toISOString() : null,
        durationMinutes: durationMinutes != null ? Number(durationMinutes) : null,
        permanent: durationMinutes == null,
        ...actor,
      };
      await writeAudit(req, 'admin.user.ban', 'user', publicBannedUserId, {
        targetUserId: publicBannedUserId,
        targetUsername: user.username,
        targetEmail: user.email,
        ...banMeta,
      });
    } else {
      await writeAudit(req, 'admin.user.unban', 'user', publicBannedUserId, {
        targetUserId: publicBannedUserId,
        targetUsername: user.username,
        targetEmail: user.email,
        ...actor,
      });
    }

    await invalidateTargetUserCaches(publicBannedUserId);
    const rawBan = user.ban?.toObject ? user.ban.toObject() : (user.ban ? { ...user.ban } : {});
    return { ok: true, ban: formatPublicEntity(rawBan) };
  } finally {
    await releaseLock(`user:mutation:${id}`, lockToken);
  }
};

const { deleteUser } = require('./users.admin.delete.service');

module.exports = { updateUser, banUser, deleteUser };
