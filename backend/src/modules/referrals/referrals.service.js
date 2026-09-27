/**
 * Referrals Service Layer
 * Handles business logic and DB interactions.
 */

const crypto = require('crypto');
const User = require('../../models/User');
const { getSettings } = require('../../lib/settings');
const { getCache, setCache, deleteCache } = require('../../lib/redis');
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
  /**
   * Fetch current user's referral stats and ensure they have a code.
   */
  async getReferralStats(userId) {
    const cacheKey = `referrals:stats:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const user = await User.findById(userId);
    if (!user) throw new Error('NOT_FOUND');

    let isModified = false;
    if (!user.referralCode) {
      for (let i = 0; i < 5; i++) {
        const code = generateCode();
        const exists = await User.findOne({ referralCode: code }).lean();
        if (!exists) { user.referralCode = code; break; }
      }
      if (!user.referralCode) user.referralCode = generateCode();
      isModified = true;
    }

    if (isModified) {
      await user.save();
    }

    const base = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const link = `${base}/join/${encodeURIComponent(user.referralCode)}`;
    const stats = user.referralStats || { referredCount: 0, coinsEarned: 0 };
    
    const s = await getSettings();
    const minInvites = Number(s?.referrals?.customCodeMinInvites ?? 10);
    const referrerCoins = Number(s?.referrals?.referrerCoins ?? 50);
    const referredCoins = Number(s?.referrals?.referredCoins ?? 25);
    const canCustomize = Number(stats.referredCount || 0) >= minInvites;

    const result = {
      code: user.referralCode,
      link,
      referredCount: Number(stats.referredCount || 0),
      coinsEarned: Number(stats.coinsEarned || 0),
      canCustomize,
      referrerCoins,
      referredCoins,
      minInvites
    };

    await setCache(cacheKey, result, 60);
    return result;
  }

  /**
   * Fetch paginated list of users referred by the given user.
   */
  async getReferredUsersList(userId, { page, limit }) {
    const cacheKey = `referrals:list:${userId}:${page}:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ referredBy: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments({ referredBy: userId })
    ]);

    const s = await getSettings();
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

    const result = { users: data, total };
    await setCache(cacheKey, result, 60);
    return result;
  }

  /**
   * Set a custom referral code if eligible.
   */
  async setCustomCode(userId, desiredCode) {
    const desired = desiredCode.toUpperCase();
    const user = await User.findById(userId);
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const s = await getSettings();
    const minInvites = Number(s?.referrals?.customCodeMinInvites ?? 10);
    const currentCount = Number(user.referralStats?.referredCount || 0);
    
    if (currentCount < minInvites) throw AppError.forbidden('Not eligible to set custom code', 'ERR_NOT_ELIGIBLE');

    const exists = await User.findOne({ referralCode: desired }).lean();
    if (exists && String(exists._id) !== String(user._id)) {
      throw AppError.conflict('Code already in use', 'ERR_CODE_IN_USE');
    }

    const oldCode = user.referralCode;
    user.referralCode = desired;
    
    try {
      await user.save();
      await deleteCache(`referrals:stats:${userId}`);
    } catch (saveError) {
      if (saveError.code === 11000) throw AppError.conflict('Code already in use', 'ERR_CODE_IN_USE');
      throw saveError;
    }

    return { code: user.referralCode, oldCode };
  }
}

module.exports = new ReferralsService();
