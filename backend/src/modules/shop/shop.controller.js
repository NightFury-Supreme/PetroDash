/**
 * Shop Controller Layer
 * Handles HTTP request/response orchestration and calls services.
 */

const shopService = require('./shop.service');
const { purchaseSchema } = require('./shop.schema');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');
const AppError = require('../../utils/AppError');

class ShopController {
  /**
   * GET /api/shop
   */
  async getItems(req, res, next) {
    try {
      const items = await shopService.getActiveItems();
      return res.json(items);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/shop/purchase
   */
  async purchaseItem(req, res, next) {
    try {
      // 1. Input Validation
      const parsed = purchaseSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new AppError('Invalid payload', 400, 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));
      }

      const { itemKey, quantity } = parsed.data;
      const userId = req.user.sub;

      // 2. Execute Business Logic
      const { updatedUser, item, totalPrice, changes } = await shopService.purchaseItem(userId, itemKey, quantity);

      // 3. Security Auditing (ISO 27001 / SOC2 compliance logging)
      await writeAudit(req, 'shop.purchase', 'shop', item._id.toString(), {
        itemKey,
        quantity,
        totalPrice,
        itemName: item.name,
        changes
      });
      
      await logUserActivity(req, 'shop.purchase', { 
        itemName: item.name, 
        quantity, 
        totalPrice,
        changes
      });

      // 4. Return Output
      return res.json({ 
        ok: true, 
        coins: updatedUser.coins, 
        resources: updatedUser.resources 
      });

    } catch (error) {
      // Handle domain-specific errors
      if (error.message === 'INVALID_ITEM_KEY') {
        return next(new AppError('Invalid item key', 400, 'ERR_SHOP_INVALID_ITEM'));
      }
      if (error.message === 'ITEM_NOT_FOUND') {
        return next(new AppError('Item not found', 404, 'ERR_SHOP_ITEM_NOT_FOUND'));
      }
      if (error.message.startsWith('MAX_PER_PURCHASE_EXCEEDED:')) {
        const max = error.message.split(':')[1];
        return next(new AppError(`Max ${max} per purchase`, 400, 'ERR_SHOP_MAX_PER_PURCHASE', { max }));
      }
      if (error.message === 'INSUFFICIENT_COINS') {
        return next(new AppError('Insufficient coins', 400, 'ERR_SHOP_INSUFFICIENT_COINS'));
      }

      // Propagate unexpected errors
      next(error);
    }
  }
}

module.exports = new ShopController();
