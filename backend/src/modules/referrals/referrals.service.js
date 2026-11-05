const crypto = require('crypto');
const User = require('../../models/User');
const { getSettings } = require('../../lib/settings');
const { getOrSetCache, acquireLock, releaseLock } = require('../../lib/redis');
const { invalidateUserCaches, invalidateReferralCaches } = require('../../utils/userCacheInvalidation');
const { buildIdFilter } = require('../../utils/publicId');
const AppError = require('../../utils/AppError');

function generateCode() {
  return (crypto.randomBytes(4).toString('hex') + Date.now().toString(36).slice(-4)).toUpperCase();
}

function maskName(name) {
  if (!name) return "";
  const parts = name.split(" ");
  return parts.map(p => p.length <= 1 ? p : p[0] + "***").join(" ");
}

function maskEmail(email) {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 1) return email;
  const maskedLocal = local[0] + "****";
  const domainParts = domain.split(".");
  const maskedDomain = domainParts[0][0] + "****" + "." + domainParts.slice(1).join(".");
  return `${maskedLocal}@${maskedDomain}`;
}

class ReferralsService {
  async getReferralStats(userId) {
    const user = await User.findOne(buildIdFilter(userId)).select('_id publicId referralCode referralStats').lean();
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const cacheKey = `referrals:stats:${user.publicId}`;

    return getOrSetCache(cacheKey, async () => {
      let currentCode = user.referralCode;
      if (!currentCode) {
        let newCode = null;
        for (let i = 0; i < 5; i++) {
          const code = generateCode();
          const exists = await User.exists({ referralCode: code });
          if (!exists) { newCode = code; break; }
        }
        if (!newCode) newCode = generateCode();

        await User.updateOne({ _id: user._id }, { $set: { referralCode: newCode } });
        currentCode = newCode;
      }

      const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
      const link = base ? `${base}/join/${encodeURIComponent(currentCode)}` : `/join/${encodeURIComponent(currentCode)}`;
      const stats = user.referralStats || { referredCount: 0, coinsEarned: 0 };

      const s = await getSettings();
      const minInvites = Number(s?.referrals?.customCodeMinInvites ?? 10);
      const referrerCoins = Number(s?.referrals?.referrerCoins ?? 50);
      const referredCoins = Number(s?.referrals?.referredCoins ?? 25);
      const canCustomize = Number(stats.referredCount || 0) >= minInvites;

      return {
        code: currentCode,
        link,
        referredCount: Number(stats.referredCount || 0),
        coinsEarned: Number(stats.coinsEarned || 0),
        canCustomize,
        referrerCoins,
        referredCoins,
        minInvites
      };
    }, 60);
  }

  async getReferredUsersList(userId, { page, limit }) {
    const user = await User.findOne(buildIdFilter(userId)).select('_id publicId').lean();
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const cacheKey = `referrals:list:${user.publicId}:${page}:${limit}`;

    return getOrSetCache(cacheKey, async () => {
      const skip = (page - 1) * limit;

      const [users, total, s] = await Promise.all([
        User.find({ referredBy: user._id })
          .select('firstName lastName username email createdAt referralRewardReceived')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments({ referredBy: user._id }),
        getSettings()
      ]);

      const referrerCoins = Number(s?.referrals?.referrerCoins ?? 50);

      const data = users.map(u => {
        const rawName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'Unknown User';
        return {
          name: maskName(rawName),
          email: maskEmail(u.email),
          joinedAt: new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          reward: u.referralRewardReceived ? referrerCoins : 0,
          status: u.referralRewardReceived ? 'Earned' : 'Pending'
        };
      });

      return { users: data, total };
    }, 60);
  }

  async setCustomCode(userId, desiredCode) {
    const desired = desiredCode.trim().toUpperCase();

    const user = await User.findOne(buildIdFilter(userId)).select('referralCode referralStats publicId');
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const s = await getSettings();
    const minInvites = Number(s?.referrals?.customCodeMinInvites ?? 10);
    const currentCount = Number(user.referralStats?.referredCount || 0);

    if (currentCount < minInvites) throw AppError.forbidden('Not eligible to set custom code', 'ERR_NOT_ELIGIBLE');

    const existsFast = await User.findOne({ referralCode: desired }).select('publicId').lean();
    if (existsFast && existsFast.publicId !== user.publicId) {
      throw AppError.conflict('Code already in use', 'ERR_CODE_IN_USE');
    }

    const lockKey = `referral:code:${desired}`;
    const lockToken = await acquireLock(lockKey, 5000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please wait', 'ERR_CONCURRENT_TRANSACTION');
    }

    try {
      const existsInLock = await User.findOne({ referralCode: desired }).select('publicId').lean();
      if (existsInLock && existsInLock.publicId !== user.publicId) {
        throw AppError.conflict('Code already in use', 'ERR_CODE_IN_USE');
      }

      const oldCode = user.referralCode;
      user.referralCode = desired;

      try {
        await user.save();
      } catch (saveError) {
        if (saveError.code === 11000) throw AppError.conflict('Code already in use', 'ERR_CODE_IN_USE');
        throw saveError;
      }

      await Promise.allSettled([
        invalidateReferralCaches(user.publicId),
        invalidateUserCaches(user.publicId),
      ]);

      return { code: user.referralCode, oldCode };
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }
}

module.exports = new ReferralsService();
