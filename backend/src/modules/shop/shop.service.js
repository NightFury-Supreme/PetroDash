const ShopItem = require('../../models/ShopItem');
const User = require('../../models/User');
const { calculateUserTotalResources } = require('../../utils/resourceCalculator');
const { getOrSetCache, acquireLock, releaseLock } = require('../../lib/redis');
const { invalidateUserCaches } = require('../../utils/userCacheInvalidation');
const { buildIdFilter } = require('../../utils/publicId');
const AppError = require('../../utils/AppError');

const ALLOWED_ITEM_KEYS = new Set([
  'diskMb',
  'memoryMb',
  'cpuPercent',
  'backups',
  'databases',
  'allocations',
  'serverSlots'
]);

class ShopService {
  async getActiveItems() {
    return getOrSetCache('api:shop', async () => {
      const items = await ShopItem.find({ enabled: true }).lean();
      return items.map((item) => {
        const { _id: _dbId, __v: _version, ...itemData } = item;
        return {
          ...itemData,
          id: item.key,
        };
      });
    }, 60);
  }

  async purchaseItem(userId, itemKey, quantity) {
    const lockKey = `user:${userId}:purchase`;
    const lockToken = await acquireLock(lockKey, 10000);
    if (!lockToken) {
      throw AppError.conflict('Operation in progress, please wait', 'ERR_CONCURRENT_TRANSACTION');
    }

    try {
      if (!ALLOWED_ITEM_KEYS.has(itemKey)) {
        throw AppError.badRequest('Invalid item key', 'ERR_SHOP_INVALID_ITEM');
      }

      const item = await ShopItem.findOne({ key: itemKey, enabled: true }).lean();
      if (!item) {
        throw AppError.notFound('Item not found', 'ERR_SHOP_ITEM_NOT_FOUND');
      }

      if (Number(item.maxPerPurchase || 0) > 0 && quantity > Number(item.maxPerPurchase)) {
        throw AppError.badRequest(`Max ${item.maxPerPurchase} per purchase`, 'ERR_SHOP_MAX_PER_PURCHASE', { max: item.maxPerPurchase });
      }

      const totalPrice = Number(item.pricePerUnit) * quantity;
      const increment = Number(item.amountPerUnit) * quantity;
      const keyToField = item.key;

      const user = await User.findOne(buildIdFilter(userId)).select('_id publicId coins resources').lean();
      if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id, coins: { $gte: totalPrice } },
        { 
          $inc: { 
            coins: -totalPrice,
            [`resources.${keyToField}`]: increment
          }
        },
        { new: true }
      );

      if (!updatedUser) {
        throw AppError.badRequest('Insufficient coins', 'ERR_SHOP_INSUFFICIENT_COINS');
      }

      await invalidateUserCaches(user.publicId);

      const { totalResources } = await calculateUserTotalResources(updatedUser);

      const changes = {
        coins: {
          old: updatedUser.coins + totalPrice,
          new: updatedUser.coins
        },
        [itemKey]: {
          old: (updatedUser.resources[keyToField] || 0) - increment,
          new: updatedUser.resources[keyToField] || 0
        }
      };

      return {
        updatedUser,
        totalResources,
        item,
        totalPrice,
        increment,
        changes
      };
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  }
}

module.exports = new ShopService();
