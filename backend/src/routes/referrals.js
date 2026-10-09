const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const { getSettings } = require('../lib/settings');
const { logUserActivity } = require('../middleware/userActivity');

const router = express.Router();

function generateCode() {
  const crypto = require('crypto');
  return (crypto.randomBytes(4).toString('hex') + Date.now().toString(36).slice(-4)).toUpperCase();
};

// Rate limiting handled globally in /api

// GET /api/referrals/me - ensure code and return stats
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Not found' });

    if (!user.referralCode) {
      // Assign a unique code
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
    // Fetch threshold from settings
    const s = await getSettings();
    const minInvites = Number(s?.referrals?.customCodeMinInvites ?? 10);
    const referrerCoins = Number(s?.referrals?.referrerCoins ?? 50);
    const referredCoins = Number(s?.referrals?.referredCoins ?? 25);
    const canCustomize = Number(stats.referredCount || 0) >= minInvites;
    return res.json({ 
      code: user.referralCode, 
      link, 
      referredCount: Number(stats.referredCount || 0), 
      coinsEarned: Number(stats.coinsEarned || 0), 
      canCustomize,
      referrerCoins,
      referredCoins,
      minInvites
    });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

function maskName(name) {
  if (!name) return "";
  const parts = name.split(" ");
  return parts
    .map((p) => {
      if (p.length <= 1) return p;
      return p[0] + "***";
    })
    .join(" ");
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

// GET /api/referrals/list - get paginated list of referred users
router.get('/list', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      User.find({ referredBy: req.user.sub })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ referredBy: req.user.sub })
    ]);

    const s = await getSettings();
    const referrerCoins = Number(s?.referrals?.referrerCoins ?? 50);

    const referralUsers = users.map(u => {
      const rawName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'Unknown User';
      return {
        name: maskName(rawName),
        email: maskEmail(u.email),
        joinedAt: new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        reward: u.referralRewardReceived ? referrerCoins : 0,
        status: u.referralRewardReceived ? 'Earned' : 'Pending'
      };
    });

    return res.json({ users: referralUsers, total: totalUsers });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/referrals/code - set a custom referral code if eligible
router.post('/code', requireAuth, async (req, res) => {
  try {
    const schema = z.object({ code: z.string().trim().min(3).max(20).regex(/^[A-Za-z0-9_-]+$/) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const desired = parsed.data.code.toUpperCase();
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const s = await getSettings();
    const minInvites = Number(s?.referrals?.customCodeMinInvites ?? 10);
    const currentCount = Number(user.referralStats?.referredCount || 0);
    if (currentCount < minInvites) return res.status(403).json({ error: 'Not eligible to set custom code' });
    // Check availability (case-insensitive by storing uppercase)
    const exists = await User.findOne({ referralCode: desired }).lean();
    if (exists && String(exists._id) !== String(user._id)) return res.status(409).json({ error: 'Code already in use' });
    
    user.referralCode = desired;
    try {
      await user.save();
      await logUserActivity(req, 'referral.code.update', { code: desired });
      const { writeAudit } = require('../middleware/audit');
      await writeAudit(req, 'referral.code.update', 'referral', user._id.toString(), {
        code: desired
      });
      return res.json({ ok: true, code: user.referralCode });
    } catch (saveError) {
      if (saveError.code === 11000) {
        return res.status(409).json({ error: 'Code already in use' });
      }
      throw saveError;
    }
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


