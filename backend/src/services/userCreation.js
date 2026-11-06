const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const DefaultResources = require('../models/DefaultResources');
const { getSettings } = require('../lib/settings');
const { acquireLock, releaseLock, deleteCache } = require('../lib/redis');
const { invalidateUserCaches, invalidateReferralCaches } = require('../utils/userCacheInvalidation');
const { writeAudit } = require('../middleware/audit');
const { logUserActivity } = require('../middleware/userActivity');
const { createPanelUser, checkUserExists, findPanelUser, getPanelUser } = require('./pterodactyl');
const AppError = require('../utils/AppError');

async function syncPanelUserId(user, panelId) {
  user.pterodactylUserId = panelId;
  if (typeof user.save === 'function') await user.save();
  else await User.findByIdAndUpdate(user._id, { pterodactylUserId: panelId });
  const uid = user.publicId;
  await deleteCache(`user:${uid}:profile`);
  await deleteCache(`user:${uid}:panel`);
}

class UserCreationService {
  static async createUser(userData) {
    const { email, username, firstName, lastName, password, ref, oauthProviders } = userData;

    const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (existing) {
      throw AppError.conflict('Email or username already in use', 'ERR_USER_EXISTS');
    }

    const existingPanelUser = await findPanelUser(email).catch(() => null);
    if (!existingPanelUser) {
      const pteroCheck = await checkUserExists(null, username).catch(() => ({ usernameExists: false }));
      if (pteroCheck?.usernameExists) {
        throw AppError.conflict('Username already exists in Pterodactyl panel', 'ERR_USERNAME_IN_USE');
      }
    }

    const defaults = await DefaultResources.findOne({}).lean();
    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;

    let referralCode = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const base = username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const candidate = `${base}${suffix}`.slice(0, 12);
      const taken = await User.exists({ referralCode: candidate });
      if (!taken) {
        referralCode = candidate;
        break;
      }
    }

    const user = await User.create({
      email,
      username,
      firstName,
      lastName,
      passwordHash,
      oauthProviders: oauthProviders || {},
      referralCode,
      coins: Number(defaults?.coins || 0),
      resources: {
        diskMb: Number(defaults?.diskMb ?? 5120), memoryMb: Number(defaults?.memoryMb ?? 2048),
        cpuPercent: Number(defaults?.cpuPercent ?? 80), backups: Number(defaults?.backups ?? 0),
        databases: Number(defaults?.databases ?? 0), allocations: Number(defaults?.allocations ?? 0),
        serverSlots: Number(defaults?.serverSlots ?? 1),
      },
    });

    try {
      await this.setReferrer(user, ref);
      try {
        await this.createPterodactylUser(user, password);
      } catch (pteroErr) {
        await writeAudit(user.publicId, 'pterodactyl.user.sync_deferred', 'user', user.publicId, { error: pteroErr.message, stage: 'register' }).catch(() => {});
      }
      return user;
    } catch (err) {
      await User.deleteOne({ _id: user._id }).catch(() => {});
      throw err;
    }
  }

  static async linkOAuthProvider(user, oauthData) {
    const { provider, data } = oauthData;
    user.oauthProviders = user.oauthProviders || {};
    user.oauthProviders[provider] = data;
    await user.save();

    if (!user.pterodactylUserId) {
      try {
        await this.createPterodactylUser(user);
      } catch (pteroErr) {
        await writeAudit(user.publicId, 'pterodactyl.user.sync_deferred', 'user', user.publicId, { error: pteroErr.message, stage: 'oauth' }).catch(() => {});
      }
    }
  }

  static async setReferrer(user, ref) {
    if (!ref || typeof ref !== 'string') return;

    try {
      const cleanRef = ref.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '').slice(0, 32);
      if (!cleanRef) return;

      const referrer = await User.findOne({ referralCode: cleanRef }).select('_id publicId').lean();
      if (!referrer || referrer.publicId === user.publicId) return;

      await User.updateOne({ _id: user._id }, { $set: { referredBy: referrer._id } });
      user.referredBy = referrer._id;
      await invalidateReferralCaches(referrer.publicId);
    } catch (err) {
      if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
        throw err;
      }
    }
  }

  static async grantReferralRewards(user) {
    if (!user || !user.referredBy || user.referralRewardReceived) return;

    const lockKey = `lock:referral:${user.publicId}`;
    const lockToken = await acquireLock(lockKey, 5000);
    if (!lockToken) return;

    try {
      const referrer = await User.findById(user.referredBy).lean();
      if (!referrer) return;

      const settings = await getSettings();
      const referrerCoins = Number(settings?.referrals?.referrerCoins ?? Number(process.env.REFERRAL_REWARD_COINS || 50));
      const referredCoins = Number(settings?.referrals?.referredCoins ?? Number(process.env.REFERRAL_REFERRED_COINS || 25));

      let session = null;
      try {
        session = await mongoose.startSession();
        await session.withTransaction(async () => {
          const updatedUser = await User.findOneAndUpdate(
            { _id: user._id, referralRewardReceived: { $ne: true } },
            {
              $set: { referralRewardReceived: true },
              $inc: { coins: referredCoins },
            },
            { new: true, session }
          );

          if (!updatedUser) return;

          await User.updateOne(
            { _id: referrer._id },
            {
              $inc: {
                'referralStats.referredCount': 1,
                'referralStats.coinsEarned': referrerCoins,
                coins: referrerCoins,
              },
            },
            { session }
          );

          user.referralRewardReceived = true;
          user.coins = updatedUser.coins;
        });
      } finally {
        if (session) await session.endSession();
      }

      if (!user.referralRewardReceived) return;

      const refId = referrer.publicId;
      const uId = user.publicId;

      await Promise.allSettled([
        invalidateReferralCaches(refId),
        invalidateUserCaches(refId),
        invalidateUserCaches(uId),
      ]);

      const referredChanges = { coins: { old: user.coins - referredCoins, new: user.coins } };
      await writeAudit(uId, 'referral.reward.referred', 'referral', refId, { referrerId: refId, coinsAdded: referredCoins, changes: referredChanges });
      await logUserActivity(null, 'referral.reward.referred', { referrerId: refId, coinsAdded: referredCoins, changes: referredChanges }, uId);

      const referrerChanges = { coins: { old: referrer.coins || 0, new: (referrer.coins || 0) + referrerCoins } };
      await writeAudit(refId, 'referral.reward.referrer', 'referral', uId, {
        referredUserId: uId,
        referredUsername: user.username,
        coinsAdded: referrerCoins,
        changes: referrerChanges,
      });
      await logUserActivity(null, 'referral.reward.referrer', { referredUserId: uId, referredUsername: user.username, coinsAdded: referrerCoins, changes: referrerChanges }, refId);
    } catch (err) {
      if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
        throw err;
      }
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }

  static async createPterodactylUser(user, password) {
    if (!user) return null;

    if (user.pterodactylUserId) {
      try {
        const existing = await getPanelUser(user.pterodactylUserId);
        if (existing?.id) return existing;
      } catch (err) {
        const status = err?.response?.status;
        if (status !== 404) {
          if (
            (err?.isAxiosError && (!err.response || (status >= 500 && status < 600))) ||
            ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNABORTED'].includes(err?.code)
          ) {
            throw AppError.serviceUnavailable('Pterodactyl panel is currently unreachable', 'ERR_PANEL_UNREACHABLE');
          }
        }
      }
    }

    try {
      const existing = await findPanelUser(user.email, user.username);
      if (existing?.id) {
        await syncPanelUserId(user, existing.id);
        return existing;
      }
    } catch (err) {
      const status = err?.response?.status;
      if (
        (err?.isAxiosError && (!err.response || (status >= 500 && status < 600))) ||
        ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNABORTED'].includes(err?.code)
      ) {
        throw AppError.serviceUnavailable('Pterodactyl panel is currently unreachable', 'ERR_PANEL_UNREACHABLE');
      }
    }

    try {
      const panelPassword = password || crypto.randomBytes(8).toString('hex') + 'A1!';
      const firstName = (user.firstName && String(user.firstName).trim()) || user.username || 'User';
      const lastName = (user.lastName && String(user.lastName).trim()) || 'Member';

      const panelUser = await createPanelUser({
        email: user.email,
        username: user.username,
        firstName,
        lastName,
        password: panelPassword,
      });

      if (panelUser?.id) {
        await syncPanelUserId(user, panelUser.id);
        return panelUser;
      }
    } catch (error) {
      if (error?.response?.status === 422) {
        const recovered = await findPanelUser(user.email, user.username);
        if (recovered?.id) {
          await syncPanelUserId(user, recovered.id);
          return recovered;
        }
      }

      const status = error?.response?.status;
      if (
        (error?.isAxiosError && (!error.response || (status >= 500 && status < 600))) ||
        ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNABORTED'].includes(error?.code)
      ) {
        throw AppError.serviceUnavailable('Pterodactyl panel is currently unreachable', 'ERR_PANEL_UNREACHABLE');
      }
      throw error;
    }

    return null;
  }

  static formatUserResponse(user) {
    const publicId = user.publicId;
    return {
      id: publicId,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      coins: Number(user.coins || 0),
      pterodactylUserId: user.pterodactylUserId || null,
      resources: user.resources,
      emailVerified: Boolean(user.emailVerified),
    };
  }
}

module.exports = UserCreationService;
