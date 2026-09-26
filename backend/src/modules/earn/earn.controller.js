/**
 * Earn Controller Layer
 * Handles HTTP requests, validation wrapping, and audit logging.
 */

const earnService = require('./earn.service');
const { startEarnSchema, claimEarnSchema } = require('./earn.schema');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');
const AppError = require('../../utils/AppError');

function extractUserId(req) {
  return req.user?.sub || req.user?.userId || req.user?._id || req.user?.id;
}

class EarnController {
  async getStatus(req, res, next) {
    try {
      const userId = extractUserId(req);
      if (!userId) throw AppError.unauthorized('Unauthorized', 'ERR_UNAUTHORIZED');

      const result = await earnService.getStatus(userId);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async startSession(req, res, next) {
    try {
      const userId = extractUserId(req);
      if (!userId) throw AppError.unauthorized('Unauthorized', 'ERR_UNAUTHORIZED');

      const { method } = req.params;
      const parsed = startEarnSchema.safeParse(req.body || {});
      if (!parsed.success) {
        throw AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten());
      }

      const result = await earnService.startSession(userId, method, parsed.data.targetUrl);

      await logUserActivity(req, 'earn.start', `Started earn session via ${method}`);
      writeAudit(req, 'earn.start', 'earn_session', result.sessionId, { method });

      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async claimSession(req, res, next) {
    try {
      const userId = extractUserId(req);
      if (!userId) throw AppError.unauthorized('Unauthorized', 'ERR_UNAUTHORIZED');

      const { method } = req.params;
      const parsed = claimEarnSchema.safeParse(req.body);
      if (!parsed.success) {
        throw AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten());
      }

      const result = await earnService.claimSession(userId, method, parsed.data);

      await logUserActivity(req, 'earn.claim', `Claimed ${result.rewardCoins} coins via ${method}`);
      writeAudit(req, 'earn.claim', 'earn_session', result.sessionId, {
        method,
        rewardCoins: result.rewardCoins,
        coinsBefore: result.coinsBefore,
        coinsAfter: result.coinsAfter,
      });

      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EarnController();
