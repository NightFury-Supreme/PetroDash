const shopService = require('./shop.service');
const { purchaseSchema } = require('./shop.schema');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');
const AppError = require('../../utils/AppError');

class ShopController {
  async getItems(req, res, next) {
    try {
      const items = await shopService.getActiveItems();
      return res.json(items);
    } catch (error) {
      next(error);
    }
  }

  async purchaseItem(req, res, next) {
    try {
      const parsed = purchaseSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new AppError('Invalid payload', 400, 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));
      }

      const { itemKey, quantity } = parsed.data;
      const userId = req.user.sub;

      const { updatedUser, totalResources, item, totalPrice, changes } = await shopService.purchaseItem(userId, itemKey, quantity);

      await writeAudit(req, 'shop.purchase', 'shop', item.key, {
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

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');

      return res.json({ 
        ok: true, 
        coins: updatedUser.coins, 
        resources: totalResources,
        baseResources: updatedUser.resources
      });

    } catch (error) {
      if (error instanceof AppError) return next(error);
      next(error);
    }
  }
}

module.exports = new ShopController();
