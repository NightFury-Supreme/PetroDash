/**
 * Referrals Controller Layer
 * Handles HTTP requests, validation wrapping, and audit logging.
 */

const referralsService = require('./referrals.service');
const { setReferralCodeSchema, getReferralsListSchema } = require('./referrals.schema');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');

class ReferralsController {
  async getMyStats(req, res, next) {
    try {
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      const stats = await referralsService.getReferralStats(userId);
      return res.json(stats);
    } catch (error) {
      if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'User not found' });
      next(error);
    }
  }

  async getReferredUsersList(req, res, next) {
    try {
      const parsed = getReferralsListSchema.safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid query params', details: parsed.error.flatten() });
      
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
      if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      const desiredCode = parsed.data.code;

      const { code, oldCode } = await referralsService.setCustomCode(userId, desiredCode);

      const changes = { code: { old: oldCode, new: code } };
      await logUserActivity(req, 'referral.code.update', { code, changes });
      await writeAudit(req, 'referral.code.update', 'referral', userId.toString(), { code, changes });

      return res.json({ ok: true, code });
    } catch (error) {
      if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'User not found' });
      if (error.message === 'NOT_ELIGIBLE') return res.status(403).json({ error: 'Not eligible to set custom code' });
      if (error.message === 'CODE_IN_USE') return res.status(409).json({ error: 'Code already in use' });
      next(error);
    }
  }
}

module.exports = new ReferralsController();
