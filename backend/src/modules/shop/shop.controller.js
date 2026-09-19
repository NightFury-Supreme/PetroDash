/**
 * Shop Controller Layer
 * Handles HTTP request/response orchestration and calls services.
 */

const shopService = require('./shop.service');
const { purchaseSchema } = require('./shop.schema');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');

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
        return res.status(400).json({ 
          error: 'Invalid payload', 
          details: parsed.error.flatten() 
        });
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
        return res.status(400).json({ error: 'Invalid item key' });
      }
      if (error.message === 'ITEM_NOT_FOUND') {
        return res.status(404).json({ error: 'Item not found' });
      }
      if (error.message.startsWith('MAX_PER_PURCHASE_EXCEEDED:')) {
        const max = error.message.split(':')[1];
        return res.status(400).json({ error: `Max ${max} per purchase` });
      }
      if (error.message === 'INSUFFICIENT_COINS') {
        return res.status(400).json({ error: 'Insufficient coins' });
      }

      // Propagate unexpected errors
      next(error);
    }
  }
}

module.exports = new ShopController();
