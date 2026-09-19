/**
 * Server Controller Layer
 * Handles HTTP requests, validation wrapping, and delegates to service.
 */

const serverService = require('./server.service');
const { getServersListSchema } = require('./server.schema');

class ServerController {
  async getUsage(req, res, next) {
    try {
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      const usage = await serverService.getUsage(userId);
      return res.json(usage);
    } catch (error) {
      next(error);
    }
  }

  async listServers(req, res, next) {
    try {
      const parsed = getServersListSchema.safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid query params', details: parsed.error.flatten() });
      
      const paginate = parsed.data.paginate === 'true';
      const page = parsed.data.page;
      const pageSize = parsed.data.pageSize;
      
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      
      const result = await serverService.listServers(userId, paginate, page, pageSize);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServerController();
