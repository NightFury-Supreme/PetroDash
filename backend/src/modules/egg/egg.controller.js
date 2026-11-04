const eggService = require('./egg.service');

class EggController {
  async getPublicEggs(req, res, next) {
    try {
      const userId = req.user?.sub;
      const eggs = await eggService.getPublicEggs(userId);
      return res.json(eggs);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EggController();
