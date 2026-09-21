const shopService = require('./shop.service');

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
    const updatedItem = await shopService.updateShopItem(req.params.id, req.body, req);
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
  deleteShopItem
};
