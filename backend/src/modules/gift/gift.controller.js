/**
 * Gift Controller Layer
 * Handles HTTP requests, input validation, and audit logging.
 */

const giftService = require('./gift.service');
const { createGiftSchema, getMyGiftsSchema, redeemGiftSchema } = require('./gift.schema');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');

class GiftController {
  async createGift(req, res, next) {
    try {
      const parsed = createGiftSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      
      const { coins, maxRedemptions, expiresInDays, description } = parsed.data;
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;

      const { gift, user, totalCost } = await giftService.createGift(userId, { coins, maxRedemptions, expiresInDays, description });
      
      const changes = { coins: { old: user.coins + totalCost, new: user.coins } };
      const created = { code: gift.code, coins, maxRedemptions, validUntil: gift.validUntil };
      
      await logUserActivity(req, 'gift.create', { coins, maxRedemptions, changes, created });
      
      return res.status(201).json({ code: gift.code, coins, maxRedemptions, validUntil: gift.validUntil });
    } catch (error) {
      if (error.message === 'TOO_MANY_ACTIVE_CODES') return res.status(400).json({ error: 'Too many active codes' });
      if (error.message.startsWith('INSUFFICIENT_COINS:')) {
        const [, total, c, m] = error.message.split(':');
        return res.status(400).json({ error: `Insufficient coins. Creating a gift code for ${m} users with ${c} coins requires ${total} coins in total.` });
      }
      next(error);
    }
  }

  async getMyGifts(req, res, next) {
    try {
      const parsed = getMyGiftsSchema.safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid query params' });
      
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
      if (!parsed.success) return res.status(400).json({ error: 'Invalid code format' });
      
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
      const msgMap = {
        INVALID: 'The gift code you entered is invalid or disabled.',
        NOT_ACTIVE: 'This gift code is not active yet.',
        EXPIRED: 'This gift code has expired.',
        LIMIT: 'This gift code has reached its maximum redemption limit.',
        DUP: 'You have already redeemed this gift code.',
        NOUSER: 'Your user account could not be found.',
      };
      const statusMap = {
        INVALID: 404,
        NOT_ACTIVE: 400,
        EXPIRED: 400,
        LIMIT: 400,
        DUP: 400,
        NOUSER: 404,
      };
      
      const key = error.message;
      if (msgMap[key]) {
        return res.status(statusMap[key]).json({ error: msgMap[key] });
      }
      next(error);
    }
  }
}

module.exports = new GiftController();
