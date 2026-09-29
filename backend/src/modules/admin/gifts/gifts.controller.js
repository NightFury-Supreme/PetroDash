/* ==========================================================================
   Admin Gifts Controller
   Compliance: ISO/IEC 25010, OWASP Input Validation, Audit Logging
========================================================================== */

const giftsService = require('./gifts.service');
const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');
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
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      const gift = await giftsService.createGift(parsedBody, userId);
      await writeAudit(req, 'admin.gift.create', 'gift', gift._id.toString(), { created: parsedBody });
      res.status(201).json(gift);
    } catch (error) {
      next(error);
    }
  }

  async updateGift(req, res, next) {
    try {
      const parsedBody = updateGiftSchema.parse(req.body);
      const { gift, changes } = await giftsService.updateGift(String(req.params.id), parsedBody);
      await writeAudit(req, 'admin.gift.update', 'gift', gift._id.toString(), {
        changes: Object.keys(changes).length > 0 ? changes : undefined,
      });

      if (gift.source === 'user' && gift.createdBy) {
        await logUserActivity(req, 'admin.gift.update', {
          giftId: gift._id.toString(),
          code: gift.code,
          updatedByAdmin: true,
          adminId: req?.user?.sub || req?.user?.userId,
          adminUsername: req?.user?.username || 'admin',
          adminRole: req?.user?.role || 'admin',
          changes: Object.keys(changes).length > 0 ? changes : undefined,
        }, gift.createdBy.toString());
      }

      res.json(gift);
    } catch (error) {
      next(error);
    }
  }

  async deleteGift(req, res, next) {
    try {
      const gift = await giftsService.deleteGift(String(req.params.id));
      await writeAudit(req, 'admin.gift.delete', 'gift', req.params.id, { code: gift.code });
      res.json({ success: true, message: 'Gift deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GiftsController();
