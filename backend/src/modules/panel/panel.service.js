const crypto = require('crypto');
const User = require('../../models/User');
const UserCreationService = require('../../services/userCreation');
const { getCache, setCache } = require('../../lib/redis');
const { getPanelUser, updatePanelUser } = require('../../services/pterodactyl');

class PanelService {
  async getPanelInfo(userId) {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('NOT_FOUND');

    if (!user.pterodactylUserId) {
      await UserCreationService.createPterodactylUser(user);
      if (!user.pterodactylUserId) throw new Error('PROVISIONING_PENDING');
    }

    const panelUrl = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
    if (!panelUrl) throw new Error('CONFIG_ERROR');

    const cacheKey = "user:" + userId + ":panel";
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const panelUser = await getPanelUser(user.pterodactylUserId);
    if (!panelUser) throw new Error('PANEL_USER_NOT_FOUND');

    const result = {
      email: panelUser.email || user.email,
      username: panelUser.username || user.username,
      panelUrl,
      loginUrl: panelUrl + '/auth/login',
    };

    await setCache(cacheKey, result, 60);
    return result;
  }

  async resetPassword(userId) {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('NOT_FOUND');

    if (!user.pterodactylUserId) {
      await UserCreationService.createPterodactylUser(user);
      if (!user.pterodactylUserId) throw new Error('PROVISIONING_PENDING');
    }

    const panelUser = await getPanelUser(user.pterodactylUserId);
    if (!panelUser) throw new Error('PANEL_USER_NOT_FOUND');

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let newPassword = '';
    for (let i = 0; i < 16; i++) {
      newPassword += chars.charAt(crypto.randomInt(chars.length));
    }

    await updatePanelUser(user.pterodactylUserId, {
      email: panelUser.email,
      username: panelUser.username,
      first_name: panelUser.first_name || '',
      last_name: panelUser.last_name || '',
      password: newPassword,
    });

    return newPassword;
  }
}

module.exports = new PanelService();
