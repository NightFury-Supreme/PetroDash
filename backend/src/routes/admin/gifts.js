const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const Gift = require('../../models/Gift');
const { writeAudit } = require('../../middleware/audit');

const router = express.Router();

// GET /api/admin/gifts
router.get('/', requireAdmin, async (req, res) => {
  try {
    const gifts = await Gift.find({}).sort({ createdAt: -1 })
      .populate('createdBy', 'username email')
      .populate('redemptions.user', 'username email')
      .lean();
    res.json(gifts);
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
    if (gift.source === 'user') {
      return res.status(403).json({ error: 'User-generated codes are read-only' });
    }

    const { code, description, rewards, maxRedemptions, validFrom, validUntil, enabled } = req.body;
    if (code && code.toUpperCase() !== gift.code) {
      const exists = await Gift.findOne({ code: code.toUpperCase() });
      if (exists) return res.status(400).json({ error: 'Code already exists' });
      gift.code = code.toUpperCase();
    }
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
    if (gift.source === 'user') {
      return res.status(403).json({ error: 'User-generated codes cannot be deleted' });
    }
    if (gift.redeemedCount > 0) return res.status(400).json({ error: 'Cannot delete a redeemed gift' });
    await Gift.findByIdAndDelete(req.params.id);
    writeAudit(req, 'admin.gifts.delete', 'gift', req.params.id, { code: gift.code });
    res.json({ message: 'Gift deleted' });
  } catch (error) {
    console.error('Gift delete error:', error);
    res.status(500).json({ error: 'Failed to delete gift' });
  }
});

module.exports = router;


