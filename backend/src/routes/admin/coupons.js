const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const Coupon = require('../../models/Coupon');
const { writeAudit } = require('../../middleware/audit');

const router = express.Router();

// GET /api/admin/coupons - list all coupons
router.get('/', requireAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// GET /api/admin/coupons/:id - get specific coupon
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id).lean();
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupon' });
  }
});

// POST /api/admin/coupons - create new coupon
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { code, type, value, validFrom, validUntil, maxRedemptions, appliesToPlanIds, enabled } =
      req.body;

    // Validate required fields
    if (!code || !type || value === undefined) {
      return res.status(400).json({ error: 'Code, type, and value are required' });
    }

    // Validate type
    if (!['percentage', 'fixed'].includes(type)) {
      return res.status(400).json({ error: 'Type must be percentage or fixed' });
    }

    // Validate value
    if (value <= 0) {
      return res.status(400).json({ error: 'Value must be greater than 0' });
    }

    if (type === 'percentage' && value > 100) {
      return res.status(400).json({ error: 'Percentage cannot exceed 100' });
    }

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    // Create coupon
    const coupon = new Coupon({
      code: code.toUpperCase(),
      type,
      value,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      maxRedemptions: maxRedemptions ? parseInt(maxRedemptions) : undefined,
      appliesToPlanIds: appliesToPlanIds || [],
      enabled: enabled !== undefined ? enabled : true,
      redeemedCount: 0
    });

    await coupon.save();

    // Audit log
    writeAudit(req, 'admin.coupons.create', 'coupon', coupon._id.toString(), { code: coupon.code });

    res.status(201).json(coupon);
  } catch (error) {
    console.error('Coupon creation error:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// PATCH /api/admin/coupons/:id - update coupon
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { code, type, value, validFrom, validUntil, maxRedemptions, appliesToPlanIds, enabled } =
      req.body;

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Validate type if provided
    if (type && !['percentage', 'fixed'].includes(type)) {
      return res.status(400).json({ error: 'Type must be percentage or fixed' });
    }

    // Validate value if provided
    if (value !== undefined) {
      if (value <= 0) {
        return res.status(400).json({ error: 'Value must be greater than 0' });
      }
      if (type === 'percentage' && value > 100) {
        return res.status(400).json({ error: 'Percentage cannot exceed 100' });
      }
    }

    // Check if code already exists (if changing code)
    if (code && code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (existingCoupon) {
        return res.status(400).json({ error: 'Coupon code already exists' });
      }
    }

    // Update fields
    if (code !== undefined) coupon.code = code.toUpperCase();
    if (type !== undefined) coupon.type = type;
    if (value !== undefined) coupon.value = value;
    if (validFrom !== undefined) coupon.validFrom = validFrom ? new Date(validFrom) : undefined;
    if (validUntil !== undefined) coupon.validUntil = validUntil ? new Date(validUntil) : undefined;
    if (maxRedemptions !== undefined)
      coupon.maxRedemptions = maxRedemptions ? parseInt(maxRedemptions) : undefined;
    if (appliesToPlanIds !== undefined) coupon.appliesToPlanIds = appliesToPlanIds;
    if (enabled !== undefined) coupon.enabled = enabled;

    await coupon.save();

    // Audit log
    writeAudit(req, 'admin.coupons.update', 'coupon', coupon._id.toString(), { code: coupon.code });

    res.json(coupon);
  } catch (error) {
    console.error('Coupon update error:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// DELETE /api/admin/coupons/:id - delete coupon
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Check if coupon has been used
    if (coupon.redeemedCount > 0) {
      return res.status(400).json({ error: 'Cannot delete coupon that has been used' });
    }

    await Coupon.findByIdAndDelete(req.params.id);

    // Audit log
    writeAudit(req, 'admin.coupons.delete', 'coupon', req.params.id, { code: coupon.code });

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Coupon deletion error:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

module.exports = router;
