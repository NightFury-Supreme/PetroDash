const giftsService = require('./gifts.service');
const { writeAudit } = require('../../../middleware/audit');
const {
  createGiftSchema,
  updateGiftSchema,
  listGiftsQuerySchema,
  giftRedemptionsQuerySchema,
} = require('./gifts.schema');

class GiftsController {
  async listGifts(req, res, next) {
    try {
      const parsedQuery = listGiftsQuerySchema.parse(req.query);
      const result = await giftsService.listGifts(parsedQuery);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getGift(req, res, next) {
    try {
      const gift = await giftsService.getGiftById(String(req.params.id));
      res.json(gift);
    } catch (error) {
      next(error);
    }
  }

  async getGiftRedemptions(req, res, next) {
    try {
      const parsedQuery = giftRedemptionsQuerySchema.parse(req.query);
      const result = await giftsService.getGiftRedemptions(String(req.params.id), parsedQuery);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createGift(req, res, next) {
    try {
      const parsedBody = createGiftSchema.parse(req.body);
      const userId = req.user?.publicId;
      const gift = await giftsService.createGift(parsedBody, userId);
      await writeAudit(req, 'admin.gift.create', 'gift', gift.id || gift.code, { created: parsedBody });
      res.status(201).json(gift);
    } catch (error) {
      next(error);
    }
  }

  async updateGift(req, res, next) {
    try {
      const parsedBody = updateGiftSchema.parse(req.body);
      const { gift, changes } = await giftsService.updateGift(String(req.params.id), parsedBody);
      await writeAudit(req, 'admin.gift.update', 'gift', gift.id || gift.code, {
        changes: Object.keys(changes).length > 0 ? changes : undefined,
      });

      res.json(gift);
    } catch (error) {
      next(error);
    }
  }

  async deleteGift(req, res, next) {
    try {
      const gift = await giftsService.deleteGift(String(req.params.id));
      await writeAudit(req, 'admin.gift.delete', 'gift', gift.id || req.params.id, { code: gift.code });
      res.json({ success: true, message: 'Gift deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GiftsController();
