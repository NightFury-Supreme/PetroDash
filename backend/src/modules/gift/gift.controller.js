/**
 * Gift Controller Layer
 * Handles HTTP requests, input validation, and audit logging.
 */

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
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;

      const { gift, user, totalCost } = await giftService.createGift(userId, { coins, maxRedemptions, expiresInDays, description });
      
      const changes = { coins: { old: user.coins + totalCost, new: user.coins } };
      const created = { code: gift.code, coins, maxRedemptions, validUntil: gift.validUntil };
      await logUserActivity(req, 'gift.create', { coins, maxRedemptions, changes, created });
      await writeAudit(req, 'gift.create', 'gift', gift._id.toString(), { code: gift.code, coins, maxRedemptions });
      
      return res.status(201).json({ code: gift.code, coins, maxRedemptions, validUntil: gift.validUntil });
    } catch (error) {
      if (error.message === 'TOO_MANY_ACTIVE_CODES') return next(new AppError('Too many active codes', 400, 'ERR_TOO_MANY_ACTIVE_CODES'));
      if (error.message.startsWith('INSUFFICIENT_COINS:')) {
        const [, total, c, m] = error.message.split(':');
        return next(new AppError(`Insufficient coins. Creating a gift code for ${m} users with ${c} coins requires ${total} coins in total.`, 400, 'ERR_INSUFFICIENT_COINS', { total, coins: c, users: m }));
      }
      next(error);
    }
  }

  async getMyGifts(req, res, next) {
    try {
      const parsed = getMyGiftsSchema.safeParse(req.query);
      if (!parsed.success) return next(new AppError('Invalid query params', 400, 'ERR_INVALID_QUERY_PARAMS'));
      
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      const result = await giftService.getUserGifts(userId, parsed.data);
      
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async redeemGift(req, res, next) {
    try {
      const parsed = redeemGiftSchema.safeParse(req.body);
      if (!parsed.success) return next(new AppError('Invalid code format', 400, 'ERR_INVALID_CODE_FORMAT'));
      
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      const result = await giftService.redeemGift(userId, parsed.data.code);
      
      const metadata = { code: result.codeUpper, changes: result.changes || {} };
      
      await logUserActivity(req, 'gift.redeem', metadata);
      await writeAudit(req, 'gift.redeem', 'gift', null, metadata);
      
      return res.json({ 
        message: 'Gift redeemed successfully', 
        description: result.description, 
        rewards: result.rewards, 
        appliedPlans: result.appliedPlans, 
        user: result.user 
      });
    } catch (error) {
      const errorMap = {
        INVALID: { msg: 'The gift code you entered is invalid or disabled.', status: 404, code: 'ERR_GIFT_INVALID' },
        NOT_ACTIVE: { msg: 'This gift code is not active yet.', status: 400, code: 'ERR_GIFT_NOT_ACTIVE' },
        EXPIRED: { msg: 'This gift code has expired.', status: 400, code: 'ERR_GIFT_EXPIRED' },
        LIMIT: { msg: 'This gift code has reached its maximum redemption limit.', status: 400, code: 'ERR_GIFT_LIMIT_REACHED' },
        DUP: { msg: 'You have already redeemed this gift code.', status: 400, code: 'ERR_GIFT_ALREADY_REDEEMED' },
        NOUSER: { msg: 'Your user account could not be found.', status: 404, code: 'ERR_USER_NOT_FOUND' },
      };
      
      const key = error.message;
      if (errorMap[key]) {
        return next(new AppError(errorMap[key].msg, errorMap[key].status, errorMap[key].code));
      }
      next(error);
    }
  }
}

module.exports = new GiftController();
