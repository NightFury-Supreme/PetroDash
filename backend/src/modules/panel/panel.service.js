const crypto = require('crypto');
const User = require('../../models/User');
const UserCreationService = require('../../services/userCreation');
const { getOrSetCache, deleteCache, acquireLock, releaseLock } = require('../../lib/redis');
const { getServer: getPanelUser, updatePanelUser, findPanelUser } = require('../../services/pterodactyl');
const { buildIdFilter } = require('../../utils/publicId');
const AppError = require('../../utils/AppError');

function generateSecurePassword() {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = uppers + lowers + digits + symbols;

  const pick = (set) => set.charAt(crypto.randomInt(set.length));

  const passwordChars = [
    pick(uppers),
    pick(lowers),
    pick(digits),
    pick(symbols),
  ];

  for (let i = passwordChars.length; i < 16; i++) {
    passwordChars.push(pick(all));
  }

  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    const temp = passwordChars[i];
    passwordChars[i] = passwordChars[j];
    passwordChars[j] = temp;
  }

  return passwordChars.join('');
}

async function ensurePanelUser(user) {
  let panelUserId = user.pterodactylUserId;

  if (!panelUserId) {
    const created = await UserCreationService.createPterodactylUser(user);
    if (created?.id) {
      panelUserId = created.id;
    } else {
      const refreshed = await User.findById(user._id).select('pterodactylUserId').lean();
      panelUserId = refreshed?.pterodactylUserId;
    }
    if (!panelUserId) {
      throw AppError.serviceUnavailable('Pterodactyl panel is currently unreachable', 'ERR_PANEL_UNAVAILABLE');
    }
  }

  let panelUser = null;
  try {
    panelUser = await getPanelUser(panelUserId);
  } catch (err) {
    if (err.response?.status === 404) {
      const recovered = await findPanelUser(user.email, user.username);
      if (recovered?.id) {
        panelUserId = recovered.id;
        await User.findByIdAndUpdate(user._id, { pterodactylUserId: panelUserId });
        if (user.publicId) await deleteCache(`user:${user.publicId}:profile`);
        panelUser = recovered;
      } else {
        panelUser = await UserCreationService.createPterodactylUser(user);
        if (panelUser?.id) {
          panelUserId = panelUser.id;
        }
      }
    } else {
      throw err;
    }
  }

  if (!panelUser) {
    throw AppError.notFound('Panel user not found', 'ERR_PANEL_USER_NOT_FOUND');
  }

  return { panelUser, panelUserId };
}

class PanelService {
  async getPanelInfo(userId) {
    const cacheKey = `user:${userId}:panel`;
    return getOrSetCache(cacheKey, async () => {
      const user = await User.findOne(buildIdFilter(userId)).select('pterodactylUserId email username publicId').lean();
      if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

      const panelUrl = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
      if (!panelUrl) throw AppError.internal('Panel configuration error', 'ERR_PANEL_CONFIG');

      const { panelUser } = await ensurePanelUser(user);

      return {
        email: panelUser.email || user.email,
        username: panelUser.username || user.username,
        panelUrl,
        loginUrl: `${panelUrl}/auth/login`,
      };
    }, 60);
  }

  async resetPassword(userId) {
    const lockKey = `user:${userId}:panel-password`;
    const lockToken = await acquireLock(lockKey, 5000);
    if (!lockToken) {
      throw AppError.tooManyRequests('Password reset in progress, please wait', 'ERR_RATE_LIMIT');
    }

    try {
      const user = await User.findOne(buildIdFilter(userId)).select('pterodactylUserId email username firstName lastName publicId').lean();
      if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

      const { panelUser, panelUserId } = await ensurePanelUser(user);

      const newPassword = generateSecurePassword();

      const firstName = panelUser.first_name || (user.firstName && String(user.firstName).trim()) || user.username || 'User';
      const lastName = panelUser.last_name || (user.lastName && String(user.lastName).trim()) || 'Member';

      await updatePanelUser(panelUserId, {
        email: panelUser.email || user.email,
        username: panelUser.username || user.username,
        first_name: firstName,
        last_name: lastName,
        password: newPassword,
      });

      await deleteCache(`user:${userId}:panel`);

      return newPassword;
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }
}

module.exports = new PanelService();
