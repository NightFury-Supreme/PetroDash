const locationService = require('./location.service');

class LocationController {
  async getPublicLocations(req, res, next) {
    try {
      const userId = req.user?.sub;
      const locations = await locationService.getPublicLocations(userId);
      return res.json(locations);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LocationController();
