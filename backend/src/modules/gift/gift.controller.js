const giftService = require('./gift.service');
const { createGiftSchema, getMyGiftsSchema, redeemGiftSchema } = require('./gift.schema');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');
const AppError = require('../../utils/AppError');

class GiftController {
  async createGift(req, res, next) {
    try {
      const parsed = createGiftSchema.safeParse(req.body);
      if (!parsed.success) return next(new AppError('Invalid payload', 400, 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));
      
      const { coins, maxRedemptions, expiresInDays, description } = parsed.data;
      const userId = req.user.publicId || req.user.sub || req.user.userId || req.user.id;

      const { gift, user, totalCost } = await giftService.createGift(userId, { coins, maxRedemptions, expiresInDays, description });
      
      const changes = { coins: { old: user.coins + totalCost, new: user.coins } };
      const created = { code: gift.code, coins, maxRedemptions, validUntil: gift.validUntil };
      await logUserActivity(req, 'gift.create', { coins, maxRedemptions, changes, created });
      await writeAudit(req, 'gift.create', 'gift', gift.publicId || gift.code, { code: gift.code, coins, maxRedemptions });
      
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
      });
      return res.status(201).json({
        code: gift.code,
        coins,
        maxRedemptions,
        validUntil: gift.validUntil,
        user: { coins: user.coins }
      });
    } catch (error) {
      if (error instanceof AppError) return next(error);
      next(error);
    }
  }

  async getMyGifts(req, res, next) {
    try {
      const parsed = getMyGiftsSchema.safeParse(req.query);
      if (!parsed.success) return next(new AppError('Invalid query params', 400, 'ERR_INVALID_QUERY_PARAMS'));
      
      const userId = req.user.publicId || req.user.sub || req.user.userId || req.user.id;
      const result = await giftService.getUserGifts(userId, parsed.data);
      
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
      });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async redeemGift(req, res, next) {
    try {
      const parsed = redeemGiftSchema.safeParse(req.body);
      if (!parsed.success) return next(new AppError('Invalid code format', 400, 'ERR_INVALID_CODE_FORMAT'));
      
      const userId = req.user.publicId || req.user.sub || req.user.userId || req.user.id;
      const result = await giftService.redeemGift(userId, parsed.data.code);
      
      const metadata = { code: result.codeUpper, changes: result.changes || {} };
      
      await logUserActivity(req, 'gift.redeem', metadata);
      await writeAudit(req, 'gift.redeem', 'gift', null, metadata);
      
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
      });
      return res.json({ 
        ok: true,
        code: 'GIFT_REDEEMED',
        description: result.description, 
        rewards: result.rewards, 
        appliedPlans: result.appliedPlans, 
        user: result.user 
      });
    } catch (error) {
      if (error instanceof AppError) return next(error);
      next(error);
    }
  }
}

module.exports = new GiftController();
