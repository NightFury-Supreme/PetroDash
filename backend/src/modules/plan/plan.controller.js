/**
 * Plan Controller Layer
 */

const planService = require('./plan.service');
const { getPlansSchema } = require('./plan.schema');

class PlanController {
  async getPublicPlans(req, res, next) {
    try {
      const parsed = getPlansSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid query params', details: parsed.error.flatten() });
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
