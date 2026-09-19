const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const Coupon = require('../../models/Coupon');
const { writeAudit } = require('../../middleware/audit');

const router = express.Router();

// GET /api/admin/coupons - list all coupons
router.get('/', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { getCache, setCache } = require('../../lib/redis');
    const cacheKey = `admin:coupons:page:${page}:limit:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const [coupons, total] = await Promise.all([
      Coupon.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments({})
    ]);
    
    const response = {
      coupons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };

    await setCache(cacheKey, response, 30);
    res.json(response);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// GET /api/admin/coupons/:id - get specific coupon
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(String(req.params.id)).lean();
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json(coupon);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupon' });
  }
});

// POST /api/admin/coupons - create new coupon
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      validFrom,
      validUntil,
      maxRedemptions,
      appliesToPlanIds,
      enabled
    } = req.body;

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
    await writeAudit(req, 'admin.coupon.create', 'coupon', coupon._id.toString(), { created: req.body });

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:coupons');

    res.status(201).json(coupon);
  } catch (error) {
    console.error('Coupon creation error:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// PATCH /api/admin/coupons/:id - update coupon
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      validFrom,
      validUntil,
      maxRedemptions,
      appliesToPlanIds,
      enabled
    } = req.body;

    const coupon = await Coupon.findById(String(req.params.id));
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    const originalCoupon = coupon.toObject();

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
    if (maxRedemptions !== undefined) coupon.maxRedemptions = maxRedemptions ? parseInt(maxRedemptions) : undefined;
    if (appliesToPlanIds !== undefined) coupon.appliesToPlanIds = appliesToPlanIds;
    if (enabled !== undefined) coupon.enabled = enabled;

    await coupon.save();
    
    const changes = {};
    const newCoupon = coupon.toObject();
    
    const checkDiff = (target, sourceObj, origObj, newObj, prefix = '') => {
      for (const k of Object.keys(sourceObj || {})) {
        if (typeof sourceObj[k] === 'object' && sourceObj[k] !== null && !Array.isArray(sourceObj[k])) {
          checkDiff(target, sourceObj[k], (origObj[k] || {}), (newObj[k] || {}), prefix ? `${prefix}.${k}` : k);
        } else {
          const keyName = prefix ? `${prefix}.${k}` : k;
          if (JSON.stringify(origObj[k]) !== JSON.stringify(newObj[k])) {
            target[keyName] = { old: origObj[k], new: newObj[k] };
          }
        }
      }
    };
    
    checkDiff(changes, req.body, originalCoupon, newCoupon);

    // Audit log
    await writeAudit(req, 'admin.coupon.update', 'coupon', coupon._id.toString(), { changes: Object.keys(changes).length > 0 ? changes : undefined });

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:coupons');

    res.json(coupon);
  } catch (error) {
    console.error('Coupon update error:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// DELETE /api/admin/coupons/:id - delete coupon
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(String(req.params.id));
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Check if coupon has been used
    if (coupon.redeemedCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete coupon',
        reason: 'Coupon has already been used by users',
        redeemedCount: coupon.redeemedCount,
        suggestion: 'Disable the coupon instead of deleting it'
      });
    }

    await Coupon.findByIdAndDelete(String(req.params.id));

    // Audit log
    await writeAudit(req, 'admin.coupon.delete', 'coupon', req.params.id, { code: coupon.code });

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:coupons');

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Coupon deletion error:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

module.exports = router;

