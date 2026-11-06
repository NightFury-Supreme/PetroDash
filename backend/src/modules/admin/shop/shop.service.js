const ShopItem = require('../../../models/ShopItem');
const { ensureShopPresets } = require('../../../lib/shopPresets');
const { getOrSetCache, deleteCache, acquireLock, releaseLock } = require('../../../lib/redis');
const { writeAudit } = require('../../../middleware/audit');
const AppError = require('../../../utils/AppError');

const listShopItems = async () => {
  return getOrSetCache('admin:shop', async () => {
    await ensureShopPresets();
    const items = await ShopItem.find({}).lean().sort({ key: 1 });
    return items.map((item) => {
      const { _id: _dbId, __v: _version, ...itemData } = item;
      return {
        ...itemData,
        id: item.key,
      };
    });
  }, 30);
};

const createShopItem = async () => {
  throw AppError.badRequest('Presets only. Creation disabled.', 'ERR_SHOP_CREATION_DISABLED');
};

const updateShopItem = async (id, data, req) => {
  if (!req.user || !req.user.sub) {
    throw AppError.unauthorized('User not properly authenticated', 'ERR_UNAUTHORIZED');
  }

  const lockKey = `admin:shop:lock:${id}`;
  const lockToken = await acquireLock(lockKey, 3000);
  if (!lockToken) {
    throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');
  }

  try {
    const existingItem = await ShopItem.findOne({ key: id });
    if (!existingItem) {
      throw AppError.notFound('Shop item not found', 'ERR_SHOP_NOT_FOUND');
    }

    const updatedItem = await ShopItem.findByIdAndUpdate(
      existingItem._id,
      data,
      { new: true, runValidators: true }
    );

    await Promise.allSettled([
      deleteCache('admin:shop'),
      deleteCache('api:shop'),
    ]);

    const changes = {};
    const originalItem = existingItem.toObject();
    const newItem = updatedItem.toObject();

    const checkDiff = (target, sourceObj, origObj, newObj, prefix = '') => {
      for (const k of Object.keys(sourceObj || {})) {
        if (typeof sourceObj[k] === 'object' && sourceObj[k] !== null && !Array.isArray(sourceObj[k])) {
          checkDiff(target, sourceObj[k], origObj[k] || {}, newObj[k] || {}, prefix ? `${prefix}.${k}` : k);
        } else {
          const keyName = prefix ? `${prefix}.${k}` : k;
          if (JSON.stringify(origObj[k]) !== JSON.stringify(newObj[k])) {
            target[keyName] = { old: origObj[k], new: newObj[k] };
          }
        }
      }
    };
    checkDiff(changes, data, originalItem, newItem);

    await writeAudit(req, 'admin.shop.update', 'shop_item', existingItem.key, {
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    });

    const { _id: _dbId, __v: _version, ...itemData } = updatedItem.toObject();
    return {
      ...itemData,
      id: updatedItem.key,
    };
  } finally {
    await releaseLock(lockKey, lockToken);
  }
};

const deleteShopItem = async () => {
  throw AppError.badRequest('Presets only. Deletion disabled.', 'ERR_SHOP_DELETION_DISABLED');
};

module.exports = {
  listShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
};
