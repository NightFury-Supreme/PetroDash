const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const shopController = require('../../modules/admin/shop/shop.controller');

const router = express.Router();

router.get('/', requireAdmin, shopController.listShopItems);
router.post('/', requireAdmin, shopController.createShopItem);
router.patch('/:id', requireAdmin, shopController.updateShopItem);
router.delete('/:id', requireAdmin, shopController.deleteShopItem);

module.exports = router;



