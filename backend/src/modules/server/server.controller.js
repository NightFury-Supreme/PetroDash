/**
 * Server Controller Layer
 */

const serverService = require('./server.service');
const serverCreateService = require('./server.create.service');
const serverMutationService = require('./server.mutation.service');
const { 
  getServersListSchema, 
  createServerSchema, 
  updateServerSchema 
} = require('./server.schema');
const { writeAudit } = require('../../middleware/audit');
const { logUserActivity } = require('../../middleware/userActivity');
const AppError = require('../../utils/AppError');

function extractUserId(req) {
  return req.user.sub || req.user.userId || req.user._id || req.user.id;
}

class ServerController {
  async getUsage(req, res, next) {
    try {
      const userId = extractUserId(req);
      const usage = await serverService.getUsage(userId);
      return res.json(usage);
    } catch (error) {
      next(error);
    }
  }

  async listServers(req, res, next) {
    try {
      const parsed = getServersListSchema.safeParse(req.query);
      if (!parsed.success) {
        return next(AppError.badRequest('Invalid query params', 'ERR_INVALID_QUERY_PARAMS', parsed.error.flatten()));
      }
      
      const paginate = parsed.data.paginate === 'true';
      const { page, pageSize } = parsed.data;
      const userId = extractUserId(req);
      
      const result = await serverService.listServers(userId, paginate, page, pageSize);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getServer(req, res, next) {
    try {
      const userId = extractUserId(req);
      const serverId = req.params.id;
      const result = await serverService.getServer(userId, serverId);
      res.set('Cache-Control', 'no-store');
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createServer(req, res, next) {
    try {
      const parsed = createServerSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));
      }

      const userId = extractUserId(req);
      const reqHost = `${req.protocol}://${req.get('host')}`;
      const { created, panelServer, isQueued } = await serverCreateService.createServer(userId, parsed.data, reqHost);

      await logUserActivity(req, 'server.create', { 
        serverName: created.name, 
        serverId: panelServer?.id, 
        dbId: created._id.toString(),
        created: {
          serverName: created.name,
          serverId: panelServer?.id,
          ...created.limits 
        }
      });

      await writeAudit(req, 'server.create', 'server', created._id.toString(), {
        serverName: created.name,
        eggId: created.eggId,
        locationId: created.locationId,
        panelServerId: panelServer?.id,
        created: {
          serverName: created.name,
          eggId: created.eggId,
          locationId: created.locationId,
          limits: created.limits
        }
      });

      return res.status(isQueued ? 202 : 201).json({ 
        server: created, 
        panel: panelServer,
        queued: isQueued,
        code: isQueued ? 'SERVER_QUEUED' : 'SERVER_CREATED'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateServer(req, res, next) {
    try {
      const parsed = updateServerSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(AppError.badRequest('Invalid payload', 'ERR_INVALID_PAYLOAD', parsed.error.flatten()));
      }

      const userId = extractUserId(req);
      const serverId = req.params.id;
      const { server, changes, user } = await serverMutationService.updateServer(userId, serverId, parsed.data);

      await writeAudit(req, 'server.update', 'server', server._id.toString(), { 
        changes,
        serverId: server._id,
        serverName: server.name,
        userId: user._id
      });
      
      await logUserActivity(req, 'server.update', { 
        serverName: server.name, 
        dbId: server._id.toString(), 
        changes 
      });

      return res.json({ 
        server,
        changes: Object.keys(changes).length > 0 ? changes : undefined
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteServer(req, res, next) {
    try {
      const userId = extractUserId(req);
      const serverId = req.params.id;
      const reqHost = `${req.protocol}://${req.get('host')}`;
      const { server } = await serverMutationService.deleteServer(userId, serverId, reqHost);

      await logUserActivity(req, 'server.delete', { serverId: server._id, name: server.name });
      await writeAudit(req, 'server.delete', 'server', server._id.toString(), { name: server.name });

      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServerController();
