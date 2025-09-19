const express = require('express');
const mongoose = require('mongoose');
const Gift = require('../models/Gift');
const User = require('../models/User');
const Plan = require('../models/Plan');
const UserPlan = require('../models/UserPlan');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Per-route rate limits removed; handled by global /api limiter

// POST /api/gifts/create - user creates a coin gift code
router.post('/create', requireAuth, async (req, res) => {
  try {
    const userId = (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || null;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    // additional per-route throttling removed
    const { coins, maxRedemptions = 1, expiresInDays = 30, description } = req.body || {};
    const coinsNum = Math.floor(Number(coins || 0));
    if (!coinsNum || coinsNum <= 0) return res.status(400).json({ error: 'Coins must be > 0' });
    if (coinsNum > 1_000_000) return res.status(400).json({ error: 'Coins exceed maximum allowed' });
    const maxRed = Math.max(1, Math.min(100, parseInt(maxRedemptions)) || 1);
    const ttlDays = Math.max(1, Math.min(180, parseInt(expiresInDays) || 30));

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if ((user.coins || 0) < coinsNum) return res.status(400).json({ error: 'Insufficient coins' });

    // Limit total active user-created codes to prevent abuse
    const activeCount = await Gift.countDocuments({ createdBy: userId, source: 'user', enabled: true });
    if (activeCount >= 50) return res.status(400).json({ error: 'Too many active codes' });

    // Deduct upfront to prevent abuse
    user.coins = Number(user.coins || 0) - coinsNum;

    // Generate unique code
    let code = '';
    for (let i = 0; i < 5; i++) {
      const c = `G${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const exists = await Gift.exists({ code: c });
      if (!exists) { code = c; break; }
    }
    if (!code) return res.status(500).json({ error: 'Failed to generate unique code' });

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + ttlDays);

    const gift = await Gift.create({
      code,
      description: description || `Gift from user ${userId}`,
      rewards: { coins: coinsNum, resources: {}, planIds: [] },
      maxRedemptions: maxRed,
      validFrom: new Date(),
      validUntil,
      enabled: true,
      createdBy: userId,
      source: 'user'
    });

    await user.save();
    return res.status(201).json({ code: gift.code, coins: coinsNum, maxRedemptions: gift.maxRedemptions, validUntil });
  } catch (error) {
    console.error('Create gift error:', error);
    res.status(500).json({ error: 'Failed to create gift code' });
  }
});

// GET /api/gifts/mine - list user's created gift codes
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const userId = (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || null;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const gifts = await Gift.find({ createdBy: userId }).sort({ createdAt: -1 }).lean();
    res.json(gifts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your gifts' });
  }
});

// DELETE /api/gifts/mine/:id - user deletes own gift (only if not redeemed)
// Note: User deletion of codes is intentionally not supported

// POST /api/gifts/redeem { code }
router.post('/redeem', requireAuth, async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code || typeof code !== 'string') return res.status(400).json({ error: 'Code is required' });
    const codeUpper = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,32}$/.test(codeUpper)) return res.status(400).json({ error: 'Invalid code format' });

    const authUserId = (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || null;
    if (!authUserId) return res.status(401).json({ error: 'Unauthorized' });
    // additional per-route throttling removed

    const session = await mongoose.startSession().catch(() => null);
    if (!session) {
      // Fallback without transaction (best-effort)
      const gift = await Gift.findOne({ code: codeUpper });
      if (!gift || !gift.enabled) return res.status(404).json({ error: 'Invalid or disabled code' });
      const now = new Date();
      if (gift.validFrom && now < gift.validFrom) return res.status(400).json({ error: 'Code is not active yet' });
      if (gift.validUntil && now > gift.validUntil) return res.status(400).json({ error: 'Code has expired' });
      if (gift.maxRedemptions && gift.redeemedCount >= gift.maxRedemptions) return res.status(400).json({ error: 'Code redemption limit reached' });
      const alreadyRedeemed = gift.redemptions?.some(r => r.user?.toString() === String(authUserId));
      if (alreadyRedeemed) return res.status(400).json({ error: 'You have already redeemed this code' });

      const user = await User.findById(authUserId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const rewards = gift.rewards || {};
      if (typeof rewards.coins === 'number' && rewards.coins > 0) {
        user.coins = (user.coins || 0) + rewards.coins;
      }
      const r = rewards.resources || {};
      user.resources = user.resources || {};
      user.resources.diskMb = (user.resources.diskMb || 0) + (r.diskMb || 0);
      user.resources.memoryMb = (user.resources.memoryMb || 0) + (r.memoryMb || 0);
      user.resources.cpuPercent = (user.resources.cpuPercent || 0) + (r.cpuPercent || 0);
      user.resources.backups = (user.resources.backups || 0) + (r.backups || 0);
      user.resources.databases = (user.resources.databases || 0) + (r.databases || 0);
      user.resources.allocations = (user.resources.allocations || 0) + (r.allocations || 0);
      user.resources.serverSlots = (user.resources.serverSlots || 0) + (r.serverSlots || 0);

      const appliedPlans = [];
      const planIds = Array.isArray(rewards.planIds) ? rewards.planIds : [];
      if (planIds.length > 0) {
        for (const pid of planIds) {
          try {
            const plan = await Plan.findById(pid);
            if (!plan) continue;
            const now2 = new Date();
            let expiresAt = null;
            const isLifetime = !!plan.billingOptions?.lifetime;
            if (!isLifetime) {
              expiresAt = new Date(now2);
              expiresAt.setMonth(expiresAt.getMonth() + 1);
            }
            const sub = await UserPlan.create({
              userId: user._id,
              planId: plan._id,
              purchaseDate: now2,
              expiresAt,
              status: 'active',
              billingCycle: isLifetime ? 'lifetime' : 'monthly',
              amount: plan.pricePerMonth || 0,
              resources: plan.productContent,
              isRenewable: plan.billingOptions?.renewable || false,
              isLifetime
            });
            const productContent = plan.productContent || {};
            user.coins = Number(user.coins || 0) + Number(productContent.coins || 0);
            user.resources = user.resources || {};
            const recurrentResources = productContent.recurrentResources || {};
            user.resources.diskMb = Number(user.resources.diskMb || 0) + Number(recurrentResources.diskMb || 0);
            user.resources.memoryMb = Number(user.resources.memoryMb || 0) + Number(recurrentResources.memoryMb || 0);
            user.resources.cpuPercent = Number(user.resources.cpuPercent || 0) + Number(recurrentResources.cpuPercent || 0);
            user.resources.backups = Number(user.resources.backups || 0) + Number(productContent.backups || 0);
            user.resources.databases = Number(user.resources.databases || 0) + Number(productContent.databases || 0);
            user.resources.allocations = Number(user.resources.allocations || 0) + Number(productContent.additionalAllocations || 0);
            user.resources.serverSlots = Number(user.resources.serverSlots || 0) + Number(productContent.serverLimit || 0);
            appliedPlans.push({ planId: String(plan._id), name: plan.name, subscriptionId: String(sub._id), lifetime: isLifetime, expiresAt });
          } catch (_) { /* ignore */ }
        }
      }
      await user.save();
      gift.redeemedCount = (gift.redeemedCount || 0) + 1;
      gift.redemptions = gift.redemptions || [];
      gift.redemptions.push({ user: user._id, redeemedAt: new Date() });
      await gift.save();
      return res.json({ message: 'Gift redeemed successfully', rewards: gift.rewards, appliedPlans, user: { coins: user.coins, resources: user.resources } });
    }

    // Transactional path
    let result;
    await session.withTransaction(async () => {
      const now = new Date();
      const gift = await Gift.findOne({ code: codeUpper }).session(session);
      if (!gift || !gift.enabled) throw new Error('INVALID');
      if (gift.validFrom && now < gift.validFrom) throw new Error('NOT_ACTIVE');
      if (gift.validUntil && now > gift.validUntil) throw new Error('EXPIRED');
      if (gift.maxRedemptions && gift.redeemedCount >= gift.maxRedemptions) throw new Error('LIMIT');
      const alreadyRedeemed = gift.redemptions?.some(r => r.user?.toString() === String(authUserId));
      if (alreadyRedeemed) throw new Error('DUP');

      const user = await User.findById(authUserId).session(session);
      if (!user) throw new Error('NOUSER');

      const rewards = gift.rewards || {};
      if (typeof rewards.coins === 'number' && rewards.coins > 0) {
        user.coins = (user.coins || 0) + rewards.coins;
      }
      const r = rewards.resources || {};
      user.resources = user.resources || {};
      user.resources.diskMb = (user.resources.diskMb || 0) + (r.diskMb || 0);
      user.resources.memoryMb = (user.resources.memoryMb || 0) + (r.memoryMb || 0);
      user.resources.cpuPercent = (user.resources.cpuPercent || 0) + (r.cpuPercent || 0);
      user.resources.backups = (user.resources.backups || 0) + (r.backups || 0);
      user.resources.databases = (user.resources.databases || 0) + (r.databases || 0);
      user.resources.allocations = (user.resources.allocations || 0) + (r.allocations || 0);
      user.resources.serverSlots = (user.resources.serverSlots || 0) + (r.serverSlots || 0);

      const appliedPlans = [];
      const planIds = Array.isArray(rewards.planIds) ? rewards.planIds : [];
      if (planIds.length > 0) {
        for (const pid of planIds) {
          try {
            const plan = await Plan.findById(pid).session(session);
            if (!plan) continue;
            const now2 = new Date();
            let expiresAt = null;
            const isLifetime = !!plan.billingOptions?.lifetime;
            if (!isLifetime) {
              expiresAt = new Date(now2);
              expiresAt.setMonth(expiresAt.getMonth() + 1);
            }
            const sub = await UserPlan.create([{
              userId: user._id,
              planId: plan._id,
              purchaseDate: now2,
              expiresAt,
              status: 'active',
              billingCycle: isLifetime ? 'lifetime' : 'monthly',
              amount: plan.pricePerMonth || 0,
              resources: plan.productContent,
              isRenewable: plan.billingOptions?.renewable || false,
              isLifetime
            }], { session });
            const productContent = plan.productContent || {};
            user.coins = Number(user.coins || 0) + Number(productContent.coins || 0);
            user.resources = user.resources || {};
            const recurrentResources = productContent.recurrentResources || {};
            user.resources.diskMb = Number(user.resources.diskMb || 0) + Number(recurrentResources.diskMb || 0);
            user.resources.memoryMb = Number(user.resources.memoryMb || 0) + Number(recurrentResources.memoryMb || 0);
            user.resources.cpuPercent = Number(user.resources.cpuPercent || 0) + Number(recurrentResources.cpuPercent || 0);
            user.resources.backups = Number(user.resources.backups || 0) + Number(productContent.backups || 0);
            user.resources.databases = Number(user.resources.databases || 0) + Number(productContent.databases || 0);
            user.resources.allocations = Number(user.resources.allocations || 0) + Number(productContent.additionalAllocations || 0);
            user.resources.serverSlots = Number(user.resources.serverSlots || 0) + Number(productContent.serverLimit || 0);
            appliedPlans.push({ planId: String(plan._id), name: plan.name, subscriptionId: String(sub[0]._id), lifetime: isLifetime, expiresAt });
          } catch (_) { /* ignore */ }
        }
      }

      await user.save({ session });
      gift.redeemedCount = (gift.redeemedCount || 0) + 1;
      gift.redemptions = gift.redemptions || [];
      gift.redemptions.push({ user: user._id, redeemedAt: new Date() });
      await gift.save({ session });
      result = { rewards: gift.rewards, user: { coins: user.coins, resources: user.resources }, appliedPlans };
    });
    await session.endSession();
    return res.json({ message: 'Gift redeemed successfully', ...result });
  } catch (error) {
    console.error('Redeem error:', error);
    const map = {
      INVALID: 404,
      NOT_ACTIVE: 400,
      EXPIRED: 400,
      LIMIT: 400,
      DUP: 400,
      NOUSER: 404,
    };
    const key = error && error.message || '';
    const status = map[key] || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to redeem gift' : key });
  }
});

module.exports = router;


