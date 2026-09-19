/**
 * Referrals Service Layer
 * Handles business logic and DB interactions.
 */

const crypto = require('crypto');
const User = require('../../models/User');
const { getSettings } = require('../../lib/settings');

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
    const user = await User.findById(userId);
    if (!user) throw new Error('NOT_FOUND');

    if (!user.referralCode) {
      for (let i = 0; i < 5; i++) {
        const code = generateCode();
        const exists = await User.findOne({ referralCode: code }).lean();
        if (!exists) { user.referralCode = code; break; }
      }
      if (!user.referralCode) user.referralCode = generateCode();
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

    return {
      code: user.referralCode,
      link,
      referredCount: Number(stats.referredCount || 0),
      coinsEarned: Number(stats.coinsEarned || 0),
      canCustomize,
      referrerCoins,
      referredCoins,
      minInvites
    };
  }

  /**
   * Fetch paginated list of users referred by the given user.
   */
  async getReferredUsersList(userId, { page, limit }) {
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

    return { users: data, total };
  }

  /**
   * Set a custom referral code if eligible.
   */
  async setCustomCode(userId, desiredCode) {
    const desired = desiredCode.toUpperCase();
    const user = await User.findById(userId);
    if (!user) throw new Error('NOT_FOUND');

    const s = await getSettings();
    const minInvites = Number(s?.referrals?.customCodeMinInvites ?? 10);
    const currentCount = Number(user.referralStats?.referredCount || 0);
    
    if (currentCount < minInvites) throw new Error('NOT_ELIGIBLE');

    const exists = await User.findOne({ referralCode: desired }).lean();
    if (exists && String(exists._id) !== String(user._id)) {
      throw new Error('CODE_IN_USE');
    }

    const oldCode = user.referralCode;
    user.referralCode = desired;
    
    try {
      await user.save();
    } catch (saveError) {
      if (saveError.code === 11000) throw new Error('CODE_IN_USE');
      throw saveError;
    }

    return { code: user.referralCode, oldCode };
  }
}

module.exports = new ReferralsService();
