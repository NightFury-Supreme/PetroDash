const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const User = require('../models/User');

const router = express.Router();

function generateCode() {
  // Simple base36 code from random and timestamp
  return (Math.random().toString(36).slice(2, 6) + Date.now().toString(36).slice(-4)).toUpperCase();
}

// Per-route rate limits
router.use(createRateLimiter(60, 15 * 60 * 1000)); // 60 req / 15 min for all referral routes

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
    const Settings = require('../models/Settings');
    const s = await Settings.findOne({}).lean();
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
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/referrals/custom-code - set a custom referral code if eligible
router.post('/custom-code', requireAuth, async (req, res) => {
  try {
    const schema = z.object({ code: z.string().trim().min(3).max(20).regex(/^[A-Za-z0-9_-]+$/) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    const desired = parsed.data.code.toUpperCase();
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const Settings = require('../models/Settings');
    const s = await Settings.findOne({}).lean();
    const minInvites = Number(s?.referrals?.customCodeMinInvites ?? 10);
    const currentCount = Number(user.referralStats?.referredCount || 0);
    if (currentCount < minInvites) return res.status(403).json({ error: 'Not eligible to set custom code' });
    // Check availability (case-insensitive by storing uppercase)
    const exists = await User.findOne({ referralCode: desired }).lean();
    if (exists && String(exists._id) !== String(user._id)) return res.status(409).json({ error: 'Code already in use' });
    user.referralCode = desired;
    await user.save();
    return res.json({ ok: true, code: user.referralCode });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


