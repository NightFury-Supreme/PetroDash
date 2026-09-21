const giftsService = require('./gifts.service');
const { writeAudit } = require('../../../middleware/audit');

class GiftsController {
  async listGifts(req, res, next) {
    try {
      const { search = '', tab = 'all', page = '1', limit = '10', sort = 'newest' } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

      const result = await giftsService.listGifts({ search, tab, page: pageNum, limit: limitNum, sort });
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
      const { page = '1', limit = '10' } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

      const result = await giftsService.getGiftRedemptions(String(req.params.id), { page: pageNum, limit: limitNum });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createGift(req, res, next) {
    try {
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      const gift = await giftsService.createGift(req.body, userId);
      await writeAudit(req, 'admin.gift.create', 'gift', gift._id.toString(), { created: req.body });
      res.status(201).json(gift);
    } catch (error) {
      next(error);
    }
  }

  async updateGift(req, res, next) {
    try {
      const { gift, changes } = await giftsService.updateGift(String(req.params.id), req.body);
      await writeAudit(req, 'admin.gift.update', 'gift', gift._id.toString(), { changes: Object.keys(changes).length > 0 ? changes : undefined });
      
      if (gift.source === 'user' && gift.createdBy) {
        const { logUserActivity } = require('../../../middleware/userActivity');
        await logUserActivity(null, 'admin.gift.update', {
          giftId: gift._id.toString(),
          code: gift.code,
          updatedByAdmin: true,
          changes: Object.keys(changes).length > 0 ? changes : undefined
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
      res.json({ message: 'Gift deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GiftsController();
