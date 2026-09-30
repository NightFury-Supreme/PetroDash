/**
 * Admin Users Mutation Sub-Service
 * Complies with ISO/IEC 25010 (Maintainability, Single Responsibility)
 */

const { Types } = require('mongoose');
const User = require('../../../models/User');
const Server = require('../../../models/Server');
const PendingUpdate = require('../../../models/PendingUpdate');
const AppError = require('../../../utils/AppError');
const {
  deleteServer: deletePanelServer,
  deletePanelUser,
  checkUserExists,
  updatePanelUser,
  suspendServer,
  unsuspendServer,
} = require('../../../services/pterodactyl');
const { deleteCache, deleteCachePattern } = require('../../../lib/redis');
const { sendMailTemplate } = require('../../../lib/mail');
const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');

const updateUser = async (req, id, data) => {
  if (!Types.ObjectId.isValid(String(id))) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  const isSelf = String(id) === String(req.user?.sub || req.user?.userId);

  if (isSelf) {
    if (data?.role && data.role !== 'admin') {
      throw new AppError('You cannot demote your own admin role.', 403, 'ERR_ADMIN_SELF_DEMOTE');
    }
    if (data?.ban?.isBanned === true) {
      throw new AppError('You cannot ban your own account.', 403, 'ERR_ADMIN_SELF_BAN');
    }
  }

  const user = await User.findById(String(id));
  if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');

  const originalUser = user.toObject();
  const { role, resources, coins, email, username, firstName, lastName, referralCode, ban, profilePicture } = data;

  if (role) user.role = role;
  if (typeof coins === 'number') user.coins = coins;
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
    const checkEmail = email || oldEmail;
    const checkUsername = username || oldUsername;
    const pterodactylCheck = await checkUserExists(checkEmail, checkUsername, user.pterodactylUserId);
    if (pterodactylCheck.emailExists) throw new AppError('Email already exists in Pterodactyl panel.', 409, 'ERR_PTERO_EMAIL_EXISTS');
    if (pterodactylCheck.usernameExists) throw new AppError('Username already exists in Pterodactyl panel.', 409, 'ERR_PTERO_USERNAME_EXISTS');
  }

  if (emailChanged) user.email = email;
  if (usernameChanged) user.username = username;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (profilePicture !== undefined) user.profilePicture = profilePicture;

  if (typeof referralCode === 'string') {
    const desired = referralCode.trim().toUpperCase();
    const exists = await User.findOne({ referralCode: desired }).lean();
    if (exists && String(exists._id) !== String(user._id)) {
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
    const payload = {
      email: user.email,
      username: user.username,
      first_name: user.firstName,
      last_name: user.lastName,
    };
    try {
      await updatePanelUser(user.pterodactylUserId, payload);
    } catch {
      try {
        await PendingUpdate.create({ pterodactylUserId: user.pterodactylUserId, payload: JSON.stringify(payload) });
      } catch (_) {}
    }
  }

  try {
    const templateKey = user.ban?.isBanned ? 'accountBanned' : 'loginAlert';
    if (user.email && templateKey === 'accountBanned') {
      await sendMailTemplate({
        to: user.email,
        templateKey,
        data: {
          username: user.username,
          reason: user.ban?.reason || '',
          until: user.ban?.until ? new Date(user.ban.until).toISOString() : 'lifetime',
        },
      });
    }
  } catch (_) {}

  const changes = {};
  if (role && role !== originalUser.role) changes.role = { old: originalUser.role, new: role };
  if (typeof coins === 'number' && coins !== originalUser.coins) changes.coins = { old: originalUser.coins, new: coins };
  if (emailChanged) changes.email = { old: originalUser.email, new: email };
  if (usernameChanged) changes.username = { old: originalUser.username, new: username };
  if (firstName && firstName !== originalUser.firstName) changes.firstName = { old: originalUser.firstName, new: firstName };
  if (lastName && lastName !== originalUser.lastName) changes.lastName = { old: originalUser.lastName, new: lastName };
  if (profilePicture !== undefined && profilePicture !== originalUser.profilePicture) changes.profilePicture = { old: originalUser.profilePicture, new: profilePicture };
  if (typeof referralCode === 'string' && user.referralCode !== originalUser.referralCode) changes.referralCode = { old: originalUser.referralCode, new: user.referralCode };

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
    if (ban.until !== undefined) {
      const oldTime = originalUser.ban?.until ? new Date(originalUser.ban.until).getTime() : null;
      const newTime = user.ban?.until ? new Date(user.ban.until).getTime() : null;
      if (oldTime !== newTime) changes['ban.until'] = { old: originalUser.ban?.until || null, new: user.ban?.until };
    }
  }

  const adminId = req?.user?.sub || req?.user?.userId || req?.user?._id;
  const adminUsername = req?.user?.username || 'admin';
  const adminRole = req?.user?.role || 'admin';

  await writeAudit(req, 'admin.user.update', 'user', user._id.toString(), {
    changes,
    targetUserId: user._id.toString(),
    targetUsername: user.username,
    targetEmail: user.email,
    adminId,
    adminUsername,
    adminRole,
  });

  if (Object.keys(changes).length > 0) {
    await logUserActivity(req, 'admin.user.update', {
      changes,
      updatedByAdmin: true,
      adminId,
      adminUsername,
      adminRole,
    }, user._id.toString());
  }

  const targetUserId = user._id.toString();
  await deleteCache(`user:auth:${targetUserId}`);
  await deleteCache(`user:${targetUserId}:profile`);
  await deleteCachePattern(`user:auth:${targetUserId}*`);
  await deleteCachePattern(`user:${targetUserId}:*`);
  await deleteCachePattern('admin:users*');

  const safeUser = await User.findById(user._id, { passwordHash: 0, tfaSecret: 0, tfaBackupCodes: 0 }).lean();
  return { user: safeUser };
};

const banUser = async (req, id, { isBanned, reason, durationMinutes }) => {
  if (!Types.ObjectId.isValid(String(id))) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  const user = await User.findById(String(id));
  if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');

  if (!user.ban) user.ban = {};
  user.ban.isBanned = Boolean(isBanned);
  user.ban.reason = reason || '';
  if (isBanned) {
    if (durationMinutes == null) {
      user.ban.until = null;
    } else {
      const until = new Date();
      until.setMinutes(until.getMinutes() + Number(durationMinutes || 0));
      user.ban.until = until;
    }
    user.ban.by = req.user?.sub || req.user?.userId || null;
    try {
      const servers = await Server.find({ owner: user._id, panelServerId: { $exists: true, $ne: null } }).lean();
      for (const s of servers) {
        if (!s.panelServerId) continue;
        try { await suspendServer(s.panelServerId); } catch (_) {}
      }
    } catch (_) {}
  } else {
    user.ban.isBanned = false;
    user.ban.reason = '';
    user.ban.until = null;
    user.ban.by = req.user?.sub || req.user?.userId || null;
    try {
      const servers = await Server.find({ owner: user._id, panelServerId: { $exists: true, $ne: null } }).lean();
      for (const s of servers) {
        if (!s.panelServerId) continue;
        try { await unsuspendServer(s.panelServerId); } catch (_) {}
      }
    } catch (_) {}
  }
  await user.save();

  const adminId = req?.user?.sub || req?.user?.userId || req?.user?._id;
  const adminUsername = req?.user?.username || 'admin';
  const adminRole = req?.user?.role || 'admin';

  if (isBanned) {
    await writeAudit(req, 'admin.user.ban', 'user', user._id.toString(), {
      targetUserId: user._id.toString(),
      targetUsername: user.username,
      targetEmail: user.email,
      reason: user.ban.reason || null,
      banUntil: user.ban.until ? user.ban.until.toISOString() : null,
      durationMinutes: durationMinutes != null ? Number(durationMinutes) : null,
      permanent: durationMinutes == null,
      adminId,
      adminUsername,
      adminRole,
    });
    await logUserActivity(req, 'admin.user.ban', {
      reason: user.ban.reason || null,
      banUntil: user.ban.until ? user.ban.until.toISOString() : null,
      durationMinutes: durationMinutes != null ? Number(durationMinutes) : null,
      permanent: durationMinutes == null,
      performedByAdmin: true,
      adminId,
      adminUsername,
      adminRole,
    }, user._id.toString());
  } else {
    await writeAudit(req, 'admin.user.unban', 'user', user._id.toString(), {
      targetUserId: user._id.toString(),
      targetUsername: user.username,
      targetEmail: user.email,
      adminId,
      adminUsername,
      adminRole,
    });
    await logUserActivity(req, 'admin.user.unban', {
      performedByAdmin: true,
      adminId,
      adminUsername,
      adminRole,
    }, user._id.toString());
  }

  const targetUserId = user._id.toString();
  await deleteCache(`user:auth:${targetUserId}`);
  await deleteCache(`user:${targetUserId}:profile`);
  await deleteCachePattern(`user:auth:${targetUserId}*`);
  await deleteCachePattern(`user:${targetUserId}:*`);
  await deleteCachePattern('admin:users*');

  return { ok: true, ban: user.ban };
};

const deleteUser = async (req, id) => {
  if (!Types.ObjectId.isValid(String(id))) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  if (String(id) === String(req.user?.sub || req.user?.userId)) {
    throw new AppError('Cannot delete your own admin account', 403, 'ERR_ADMIN_SELF_DELETE');
  }
  const user = await User.findById(String(id));
  if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');

  const servers = await Server.find({ owner: user._id });
  let deletedServers = 0;
  const serverErrors = [];

  for (const server of servers) {
    try {
      await deletePanelServer(server.panelServerId);
      await Server.deleteOne({ _id: server._id });
      deletedServers++;
    } catch (error) {
      serverErrors.push({ serverId: server._id, serverName: server.name, error: error.message });
    }
  }

  let pterodactylError = null;
  if (user.pterodactylUserId) {
    try {
      await deletePanelUser(user.pterodactylUserId);
    } catch (error) {
      pterodactylError = error.message;
    }
  }

  await User.deleteOne({ _id: user._id });

  const adminId = req?.user?.sub || req?.user?.userId || req?.user?._id;
  const adminUsername = req?.user?.username || 'admin';
  const adminRole = req?.user?.role || 'admin';

  await writeAudit(req, 'admin.user.delete', 'user', user._id.toString(), {
    targetUserId: user._id.toString(),
    targetUsername: user.username,
    targetEmail: user.email,
    serversDeleted: deletedServers,
    serverErrors: serverErrors.length,
    pterodactylError: !!pterodactylError,
    adminId,
    adminUsername,
    adminRole,
  });
  await logUserActivity(req, 'admin.user.delete', {
    serversDeleted: deletedServers,
    serverErrors: serverErrors.length,
    pterodactylError: !!pterodactylError,
    updatedByAdmin: true,
    adminId,
    adminUsername,
    adminRole,
  }, user._id.toString());

  const targetUserId = user._id.toString();
  await deleteCache(`user:auth:${targetUserId}`);
  await deleteCache(`user:${targetUserId}:profile`);
  await deleteCachePattern(`user:auth:${targetUserId}*`);
  await deleteCachePattern(`user:${targetUserId}:*`);
  await deleteCachePattern('admin:users*');

  const hasWarnings = serverErrors.length > 0 || !!pterodactylError;

  return {
    ok: true,
    code: hasWarnings ? 'ERR_CLEANUP_PARTIAL' : 'SUCCESS_USER_DELETED',
    serversDeleted: deletedServers,
    totalServers: servers.length,
    serverErrors,
    pterodactylError,
  };
};

module.exports = {
  updateUser,
  banUser,
  deleteUser,
};
