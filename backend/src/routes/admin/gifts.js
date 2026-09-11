const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const Gift = require('../../models/Gift');
const { writeAudit } = require('../../middleware/audit');

const router = express.Router();

// GET /api/admin/gifts
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { search = '', tab = 'all', page = '1', limit = '10', sort = 'newest' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    let filter = {};
    if (search.trim()) {
      filter.code = { $regex: search.trim(), $options: 'i' };
    }

    if (tab === 'active') {
      filter.enabled = true;
      filter.$and = [
        { $or: [{ validUntil: null }, { validUntil: { $exists: false } }, { validUntil: { $gt: new Date() } }] },
      ];
    } else if (tab === 'inactive') {
      filter.$or = [
        { enabled: false },
        { validUntil: { $lte: new Date() } }
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'oldest') {
      sortObj = { createdAt: 1 };
    }

    const total = await Gift.countDocuments(filter);
    const gifts = await Gift.find(filter)
      .sort(sortObj)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('createdBy', 'username email profilePicture')
      .populate('redemptions.user', 'username email profilePicture')
      .lean();

    res.json({
      gifts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gifts' });
  }
});

// GET /api/admin/gifts/:id
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const gift = await Gift.findById(String(req.params.id))
      .select('-redemptions')
      .populate('createdBy', 'username email profilePicture')
      .lean();
    if (!gift) return res.status(404).json({ error: 'Gift not found' });
    res.json(gift);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gift' });
  }
});

// GET /api/admin/gifts/:id/redemptions
router.get('/:id/redemptions', requireAdmin, async (req, res) => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const giftMeta = await Gift.findById(String(req.params.id)).select('redeemedCount code').lean();
    if (!giftMeta) return res.status(404).json({ error: 'Gift not found' });

    const giftRedemptions = await Gift.findById(String(req.params.id))
      .select('redemptions')
      .slice('redemptions', [(pageNum - 1) * limitNum, limitNum])
      .populate('redemptions.user', 'username email profilePicture')
      .lean();

    res.json({
      code: giftMeta.code,
      redemptions: giftRedemptions ? giftRedemptions.redemptions : [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: giftMeta.redeemedCount || 0,
        totalPages: Math.ceil((giftMeta.redeemedCount || 0) / limitNum) || 1
      }
    });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gift redemptions' });
  }
});

// POST /api/admin/gifts
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      code,
      description,
      rewards = {},
      maxRedemptions,
      validFrom,
      validUntil,
      enabled
    } = req.body;

    if (!code) return res.status(400).json({ error: 'Code is required' });

    const exists = await Gift.findOne({ code: code.toUpperCase() });
    if (exists) return res.status(400).json({ error: 'Code already exists' });

    const gift = new Gift({
      code: code.toUpperCase(),
      description: description || '',
      rewards: {
        coins: Math.min(1_000_000, Math.max(0, parseInt(rewards.coins || 0))),
        resources: {
          diskMb: Math.min(1_000_000_000, Math.max(0, parseInt(rewards.resources?.diskMb || 0))),
          memoryMb: Math.min(1_000_000_000, Math.max(0, parseInt(rewards.resources?.memoryMb || 0))),
          cpuPercent: Math.min(1000, Math.max(0, parseInt(rewards.resources?.cpuPercent || 0))),
          backups: Math.min(10_000, Math.max(0, parseInt(rewards.resources?.backups || 0))),
          databases: Math.min(10_000, Math.max(0, parseInt(rewards.resources?.databases || 0))),
          allocations: Math.min(10_000, Math.max(0, parseInt(rewards.resources?.allocations || 0))),
          serverSlots: Math.min(10_000, Math.max(0, parseInt(rewards.resources?.serverSlots || 0))),
        },
        planIds: Array.isArray(rewards.planIds) ? rewards.planIds : [],
      },
      maxRedemptions: maxRedemptions ? Math.max(0, Math.min(1_000_000, parseInt(maxRedemptions))) : 0,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      enabled: enabled !== undefined ? !!enabled : true,
      createdBy: req.user.sub || req.user.userId || req.user._id || req.user.id,
      source: 'admin'
    });

    await gift.save();
    await writeAudit(req, 'admin.gift.create', 'gift', gift._id.toString(), { created: req.body });
    res.status(201).json(gift);
  } catch (error) {
    console.error('Gift creation error:', error);
    res.status(500).json({ error: 'Failed to create gift' });
  }
});

// PATCH /api/admin/gifts/:id
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const gift = await Gift.findById(String(req.params.id));
    if (!gift) return res.status(404).json({ error: 'Gift not found' });
    
    const originalGift = gift.toObject();

    const { code, type, value, maxUses, expiresAt, enabled } = req.body;
    if (code) gift.code = code;
    if (type) gift.type = type;
    if (value !== undefined) gift.value = value;
    if (maxUses !== undefined) gift.maxUses = maxUses;
    if (expiresAt !== undefined) gift.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (enabled !== undefined) gift.enabled = !!enabled;

    await gift.save();

    const changes = {};
    for (const [k, v] of Object.entries(req.body)) {
      if (JSON.stringify(originalGift[k]) !== JSON.stringify(v)) {
        changes[k] = { old: originalGift[k], new: v };
      }
    }

    await writeAudit(req, 'admin.gift.update', 'gift', gift._id.toString(), { changes });
    res.json(gift);
  } catch (error) {
    console.error('Gift update error:', error);
    res.status(500).json({ error: 'Failed to update gift' });
  }
});

// DELETE /api/admin/gifts/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const gift = await Gift.findById(String(req.params.id));
    if (!gift) return res.status(404).json({ error: 'Gift not found' });
    await Gift.findByIdAndDelete(String(req.params.id));
    await writeAudit(req, 'admin.gift.delete', 'gift', req.params.id, { code: gift.code });
    res.json({ message: 'Gift deleted' });
  } catch (error) {
    console.error('Gift delete error:', error);
    res.status(500).json({ error: 'Failed to delete gift' });
  }
});

module.exports = router;


