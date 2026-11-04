const referralsService = require('./referrals.service');
const { setReferralCodeSchema, getReferralsListSchema } = require('./referrals.schema');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');
const AppError = require('../../utils/AppError');

class ReferralsController {
  async getMyStats(req, res, next) {
    try {
      const userId = req.user.publicId || req.user.sub || req.user.userId || req.user.id;
      const stats = await referralsService.getReferralStats(userId);

      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
      });
      return res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getReferredUsersList(req, res, next) {
    try {
      const parsed = getReferralsListSchema.safeParse(req.query);
      if (!parsed.success) return next(AppError.badRequest('Invalid query params', 'ERR_INVALID_QUERY_PARAMS', parsed.error.flatten()));

      const userId = req.user.publicId || req.user.sub || req.user.userId || req.user.id;
      const result = await referralsService.getReferredUsersList(userId, parsed.data);

      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
      });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async setCustomCode(req, res, next) {
    try {
      const parsed = setReferralCodeSchema.safeParse(req.body);
      if (!parsed.success) return next(AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));

      const userId = req.user.publicId || req.user.sub || req.user.userId || req.user.id;
      const desiredCode = parsed.data.code;

      const { code, oldCode } = await referralsService.setCustomCode(userId, desiredCode);

      const changes = { code: { old: oldCode, new: code } };
      await logUserActivity(req, 'referral.code.update', { code, changes });
      await writeAudit(req, 'referral.code.update', 'referral', userId, { code, changes });

      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
      });
      return res.json({ ok: true, code });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReferralsController();
