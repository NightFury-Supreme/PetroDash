const userPlansService = require('./userPlans.service');

class UserPlansController {
  async getActivePlans(req, res, next) {
    try {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
      });
      const userIdentifier = req.user.publicId || req.user.sub;
      const list = await userPlansService.getActivePlans(userIdentifier);
      return res.json(list);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserPlansController();
