/**
 * Admin Shop Controller
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

const shopService = require('./shop.service');
const AppError = require('../../../utils/AppError');
const {
  shopItemIdParamSchema,
  updateShopItemSchema,
} = require('./shop.schema');

const listShopItems = async (req, res, next) => {
  try {
    const items = await shopService.listShopItems();
    return res.json(items);
  } catch (error) {
    next(error);
  }
};

const createShopItem = async (req, res, next) => {
  try {
    await shopService.createShopItem();
  } catch (error) {
    next(error);
  }
};

const updateShopItem = async (req, res, next) => {
  try {
    const paramParsed = shopItemIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new AppError('Invalid shop item ID format', 400, 'ERR_INVALID_ID', paramParsed.error.flatten());
    }

    const parsed = updateShopItemSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid shop item payload', 400, 'ERR_SHOP_VALIDATION_FAILED', parsed.error.flatten());
    }

    const updatedItem = await shopService.updateShopItem(paramParsed.data.id, parsed.data, req);
    return res.json(updatedItem);
  } catch (error) {
    next(error);
  }
};

const deleteShopItem = async (req, res, next) => {
  try {
    await shopService.deleteShopItem();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
};
