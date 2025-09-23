const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const ShopItem = require('../../models/ShopItem');

const router = express.Router();
const { ensureShopPresets } = require('../../lib/shopPresets');

// List
router.get('/', requireAdmin, async (req, res) => {
  try {
    await ensureShopPresets();
    const items = await ShopItem.find({}).lean().sort({ key: 1 });
    return res.json(items);
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update schema - more restrictive for security
const updateSchema = z.object({
  amountPerUnit: z.coerce.number().min(0).max(1000000).optional(),
  pricePerUnit: z.coerce.number().min(0).max(100000).optional(),
  description: z.string().max(500).optional(),
  enabled: z.coerce.boolean().optional(),
  maxPerPurchase: z.coerce.number().int().min(1).max(10000).optional()
});

// Creation of custom items disabled: presets only
router.post('/', requireAdmin, async (req, res) => {
  return res.status(405).json({
    error: 'Presets only. Creation disabled.',
    message: 'Shop items are managed as system presets and cannot be created manually.'
  });
});

// Update
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    console.log('Shop update request:', {
      userId: req.user?._id || req.user?.sub,
      userRole: req.user?.role,
      body: req.body,
      params: req.params
    });

    // Check if user is properly authenticated
    if (!req.user || (!req.user._id && !req.user.sub)) {
      console.error('User not properly authenticated:', req.user);
      return res.status(401).json({ error: 'User not properly authenticated' });
    }

    // Validate the item exists first
    const existingItem = await ShopItem.findById(req.params.id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Shop item not found' });
    }

    // Validate update payload
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error('Validation failed:', parsed.error.flatten());
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
    }

    // Apply updates
    const updatedItem = await ShopItem.findByIdAndUpdate(req.params.id, parsed.data, {
      new: true,
      runValidators: true
    });

    // Temporarily disable audit logging to fix the immediate issue
    // await writeAudit(req.user._id || req.user.sub, 'shop_item_updated', {
    //   itemId: req.params.id,
    //   itemKey: existingItem.key,
    //   changes: parsed.data,
    //   previousValues: {
    //     amountPerUnit: existingItem.amountPerUnit,
    //     pricePerUnit: existingItem.pricePerUnit,
    //     description: existingItem.description,
    //     enabled: existingItem.enabled,
    //     maxPerPurchase: existingItem.maxPerPurchase,
    //   }
    // });

    return res.json(updatedItem);
  } catch (error) {
    console.error('Error updating shop item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete
// Deletion disabled: presets only
router.delete('/:id', requireAdmin, async (req, res) => {
  return res.status(405).json({
    error: 'Presets only. Deletion disabled.',
    message: 'Shop items are managed as system presets and cannot be deleted manually.'
  });
});

module.exports = router;
