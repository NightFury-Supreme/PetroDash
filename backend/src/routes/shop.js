const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const ShopItem = require('../models/ShopItem');
const User = require('../models/User');

const router = express.Router();

// Public list for authenticated users
router.get('/', requireAuth, async (req, res) => {
  const items = await ShopItem.find({ enabled: true }).lean();
  return res.json(items);
});

const purchaseSchema = z.object({
  itemKey: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
});

router.post('/purchase', requireAuth, async (req, res) => {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  const { itemKey, quantity } = parsed.data;

  // Whitelist known keys to prevent arbitrary field updates
  const allowedKeys = new Set(['diskMb','memoryMb','cpuPercent','backups','databases','allocations','serverSlots']);
  if (!allowedKeys.has(itemKey)) return res.status(400).json({ error: 'Invalid item key' });

  const item = await ShopItem.findOne({ key: itemKey, enabled: true }).lean();
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (quantity > Number(item.maxPerPurchase || 0)) return res.status(400).json({ error: `Max ${item.maxPerPurchase} per purchase` });

  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const totalPrice = Number(item.pricePerUnit) * Number(quantity);
  const increment = Number(item.amountPerUnit) * Number(quantity);
  const keyToField = item.key; // matches User.resources key

  // Atomically check coins and deduct to prevent TOCTOU race conditions
  const updatedUser = await User.findOneAndUpdate(
    { _id: req.user.sub, coins: { $gte: totalPrice } },
    { 
      $inc: { 
        coins: -totalPrice,
        [`resources.${keyToField}`]: increment
      }
    },
    { new: true }
  );

  if (!updatedUser) {
    return res.status(400).json({ error: 'Insufficient coins' });
  }

  const { writeAudit } = require('../middleware/audit');
  await writeAudit(req, 'shop.purchase.completed', 'shop', item._id.toString(), {
    itemKey,
    quantity,
    totalPrice,
    itemName: item.name,
    amountPerUnit: item.amountPerUnit,
    pricePerUnit: item.pricePerUnit,
    userId: updatedUser._id.toString(),
    username: updatedUser.username,
    purchaseDate: new Date().toISOString(),
    coinsBefore: updatedUser.coins + totalPrice,
    coinsAfter: updatedUser.coins,
    resourcesBefore: { ...updatedUser.resources, [keyToField]: updatedUser.resources[keyToField] - increment },
    resourcesAfter: { ...updatedUser.resources }
  });

  return res.json({ ok: true, coins: updatedUser.coins, resources: updatedUser.resources });
});

module.exports = router;


