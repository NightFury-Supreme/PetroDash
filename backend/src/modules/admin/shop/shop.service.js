const ShopItem = require('../../../models/ShopItem');
const { z } = require('zod');
const { ensureShopPresets } = require('../../../lib/shopPresets');
const { getCache, setCache, deleteCachePattern } = require('../../../lib/redis');
const { writeAudit } = require('../../../middleware/audit');
const AppError = require('../../../utils/AppError');

const updateSchema = z.object({
  amountPerUnit: z.coerce.number().min(0).max(1000000).optional(),
  pricePerUnit: z.coerce.number().min(0).max(100000).optional(),
  description: z.string().max(500).optional(),
  enabled: z.coerce.boolean().optional(),
  maxPerPurchase: z.coerce.number().int().min(1).max(10000).optional(),
});

const listShopItems = async () => {
  const cached = await getCache('admin:shop');
  if (cached) return cached;

  await ensureShopPresets();
  const items = await ShopItem.find({}).lean().sort({ key: 1 });
  
  await setCache('admin:shop', items, 30);
  return items;
};

const createShopItem = async () => {
  throw new AppError('Presets only. Creation disabled.', 405);
};

const updateShopItem = async (id, data, req) => {
  if (!req.user || (!req.user._id && !req.user.sub)) {
    throw new AppError('User not properly authenticated', 401);
  }

  const existingItem = await ShopItem.findById(String(id));
  if (!existingItem) {
    throw new AppError('Shop item not found', 404);
  }

  const parsed = updateSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError('Validation failed', 400);
  }

  const updatedItem = await ShopItem.findByIdAndUpdate(
    String(id), 
    parsed.data, 
    { new: true, runValidators: true }
  );

  await deleteCachePattern('admin:shop');

  const changes = {};
  const originalItem = existingItem.toObject();
  const newItem = updatedItem.toObject();

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
  checkDiff(changes, parsed.data, originalItem, newItem);

  await writeAudit(req, 'admin.shop.update', 'shop_item', existingItem._id.toString(), { changes: Object.keys(changes).length > 0 ? changes : undefined });

  return updatedItem;
};

const deleteShopItem = async () => {
  throw new AppError('Presets only. Deletion disabled.', 405);
};

module.exports = {
  listShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem
};
