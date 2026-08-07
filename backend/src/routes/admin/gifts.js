const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const Gift = require('../../models/Gift');
const { writeAudit } = require('../../middleware/audit');

const router = express.Router();

// GET /api/admin/gifts
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { search = '', tab = 'all', page = '1', limit = '10' } = req.query;
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
    // We cannot easily filter by (redeemedCount < maxRedemptions) in Mongoose when redeemedCount is dynamic/virtual,
    // but assuming maxRedemptions is checked on usage, active/inactive base on dates/enabled is fine.
    
    // Fallback: If maxRedemptions exist and redemptions array size >= maxRedemptions, it's inactive
    // Mongoose doesn't easily let us compare array size to a document field in a simple query without aggregate,
    // so we'll do the simpler tab logic (enabled + dates).

    const total = await Gift.countDocuments(filter);
    const gifts = await Gift.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('createdBy', 'username email')
      .populate('redemptions.user', 'username email')
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
    const gift = await Gift.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('redemptions.user', 'username email')
      .lean();
    if (!gift) return res.status(404).json({ error: 'Gift not found' });
    res.json(gift);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gift' });
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
    writeAudit(req, 'admin.gifts.create', 'gift', gift._id.toString(), { code: gift.code });
    res.status(201).json(gift);
  } catch (error) {
    console.error('Gift creation error:', error);
    res.status(500).json({ error: 'Failed to create gift' });
  }
});

// PATCH /api/admin/gifts/:id
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ error: 'Gift not found' });
    // Admins have full control over user-generated codes

    const { description, rewards, maxRedemptions, validFrom, validUntil, enabled } = req.body;
    // Note: 'code' string modification is no longer allowed.
    if (description !== undefined) gift.description = description;
    if (rewards) {
      gift.rewards = {
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
      };
    }
    if (maxRedemptions !== undefined) gift.maxRedemptions = Math.max(0, Math.min(1_000_000, parseInt(maxRedemptions) || 0));
    if (validFrom !== undefined) gift.validFrom = validFrom ? new Date(validFrom) : undefined;
    if (validUntil !== undefined) gift.validUntil = validUntil ? new Date(validUntil) : undefined;
    if (enabled !== undefined) gift.enabled = !!enabled;

    await gift.save();
    writeAudit(req, 'admin.gifts.update', 'gift', gift._id.toString(), { code: gift.code });
    res.json(gift);
  } catch (error) {
    console.error('Gift update error:', error);
    res.status(500).json({ error: 'Failed to update gift' });
  }
});

// DELETE /api/admin/gifts/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ error: 'Gift not found' });
    await Gift.findByIdAndDelete(req.params.id);
    writeAudit(req, 'admin.gifts.delete', 'gift', req.params.id, { code: gift.code });
    res.json({ message: 'Gift deleted' });
  } catch (error) {
    console.error('Gift delete error:', error);
    res.status(500).json({ error: 'Failed to delete gift' });
  }
});

module.exports = router;


