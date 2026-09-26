const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const giftsController = require('../../modules/admin/gifts/gifts.controller');

const router = express.Router();

router.get('/', requireAdmin, giftsController.listGifts);
router.get('/:id', requireAdmin, giftsController.getGift);
router.get('/:id/redemptions', requireAdmin, giftsController.getGiftRedemptions);
router.post('/', requireAdmin, giftsController.createGift);
router.put('/:id', requireAdmin, giftsController.updateGift);
router.delete('/:id', requireAdmin, giftsController.deleteGift);

module.exports = router;
