/*
  User Plans Controller
  Handles HTTP requests for retrieving user plan subscriptions.
*/

const userPlansService = require('./userPlans.service');

class UserPlansController {
  async getActivePlans(req, res, next) {
    try {
      const list = await userPlansService.getActivePlans(req.user.sub);
      res.json(list);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserPlansController();
