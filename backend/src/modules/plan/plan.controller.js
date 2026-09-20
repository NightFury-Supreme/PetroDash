/**
 * Plan Controller Layer
 */

const planService = require('./plan.service');
const { getPlansSchema } = require('./plan.schema');
const AppError = require('../../utils/AppError');

class PlanController {
  async getPublicPlans(req, res, next) {
    try {
      const parsed = getPlansSchema.safeParse(req.query);
      if (!parsed.success) {
        throw new AppError('Invalid query params', 400, 'ERR_INVALID_QUERY_PARAMS', parsed.error.flatten());
      }

      const paginate = parsed.data.paginate === 'true';
      const { page, pageSize } = parsed.data;

      const result = await planService.getPublicPlans(paginate, page, pageSize);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PlanController();
