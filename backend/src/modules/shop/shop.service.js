/**
 * Shop Service Layer
 * Handles business logic, atomic transactions, and caching.
 * Follows ISO 22301 (Reliability) and OWASP (Concurrency limits, Least Privilege).
 */

const ShopItem = require('../../models/ShopItem');
const User = require('../../models/User');
const { getCache, setCache, deleteCache } = require('../../lib/redis');

// Hardcoded whitelist to prevent arbitrary field updates via itemKey injections (CWE-20, CWE-915)
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
  /**
   * Fetch all active shop items (cached).
   * @returns {Promise<Array>} List of items
   */
  async getActiveItems() {
    const cached = await getCache('api:shop');
    if (cached) return cached;

    const items = await ShopItem.find({ enabled: true }).lean();
    await setCache('api:shop', items, 60);
    return items;
  }

  /**
   * Process an item purchase atomically.
   * @param {string} userId - ID of the user purchasing
   * @param {string} itemKey - The resource key being purchased
   * @param {number} quantity - Quantity of the item
   * @returns {Promise<Object>} Resulting updated user balances and audit details
   */
  async purchaseItem(userId, itemKey, quantity) {
    if (!ALLOWED_ITEM_KEYS.has(itemKey)) {
      throw new Error('INVALID_ITEM_KEY');
    }

    const item = await ShopItem.findOne({ key: itemKey, enabled: true }).lean();
    if (!item) {
      throw new Error('ITEM_NOT_FOUND');
    }

    if (quantity > Number(item.maxPerPurchase || 0)) {
      throw new Error(`MAX_PER_PURCHASE_EXCEEDED:${item.maxPerPurchase}`);
    }

    const totalPrice = Number(item.pricePerUnit) * quantity;
    const increment = Number(item.amountPerUnit) * quantity;
    const keyToField = item.key;

    // Atomic update: Verify coin balance AND deduct simultaneously to prevent Race Conditions (CWE-362, TOCTOU)
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, coins: { $gte: totalPrice } },
      { 
        $inc: { 
          coins: -totalPrice,
          [`resources.${keyToField}`]: increment
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error('INSUFFICIENT_COINS');
    }

    // Invalidate user profile cache safely
    await deleteCache(`user:${updatedUser._id}:profile`);

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
      item,
      totalPrice,
      increment,
      changes
    };
  }
}

module.exports = new ShopService();
