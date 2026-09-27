/**
 * Referrals Controller Layer
 * Handles HTTP requests, validation wrapping, and audit logging.
 */

const referralsService = require('./referrals.service');
const { setReferralCodeSchema, getReferralsListSchema } = require('./referrals.schema');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');
const AppError = require('../../utils/AppError');

class ReferralsController {
  async getMyStats(req, res, next) {
    try {
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      const stats = await referralsService.getReferralStats(userId);
      return res.json(stats);
    } catch (error) {
      if (error.message === 'NOT_FOUND') return next(new AppError('User not found', 404, 'ERR_USER_NOT_FOUND'));
      next(error);
    }
  }

  async getReferredUsersList(req, res, next) {
    try {
      const parsed = getReferralsListSchema.safeParse(req.query);
      if (!parsed.success) return next(new AppError('Invalid query params', 400, 'ERR_INVALID_QUERY_PARAMS', parsed.error.flatten()));
      
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      const result = await referralsService.getReferredUsersList(userId, parsed.data);
      
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async setCustomCode(req, res, next) {
    try {
      const parsed = setReferralCodeSchema.safeParse(req.body);
      if (!parsed.success) return next(new AppError('Invalid payload', 400, 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));
      
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      const desiredCode = parsed.data.code;

      const { code, oldCode } = await referralsService.setCustomCode(userId, desiredCode);

      const changes = { code: { old: oldCode, new: code } };
      await logUserActivity(req, 'referral.code.update', { code, changes });
      await writeAudit(req, 'referral.code.update', 'referral', userId.toString(), { code, changes });

      return res.json({ ok: true, code });
    } catch (error) {
      if (error instanceof AppError) return next(error);
      next(error);
    }
  }
}

module.exports = new ReferralsController();
