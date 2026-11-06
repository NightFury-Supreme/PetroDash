const serverService = require('./server.service');
const serverCreateService = require('./server.create.service');
const serverMutationService = require('./server.mutation.service');
const { 
  getServersListSchema, 
  createServerSchema, 
  updateServerSchema 
} = require('./server.schema');
const { writeAudit } = require('../../middleware/audit');
const AppError = require('../../utils/AppError');

function extractUserId(req) {
  return req.user.publicId;
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
      const { created, isQueued, egg, location } = await serverCreateService.createServer(userId, parsed.data, reqHost);
      const publicServerId = created.publicId;

      await writeAudit(req, isQueued ? 'server.queued' : 'server.create', 'server', publicServerId, {
        serverName: created.name,
        serverId: publicServerId,
        egg: egg?.name || parsed.data.eggId,
        location: location?.name || parsed.data.locationId,
        status: created.status,
        created: {
          serverId: publicServerId,
          serverName: created.name,
          status: created.status,
          ...(created.identifier ? { identifier: created.identifier } : {}),
          ...(created.panelServerId ? { panelServerId: created.panelServerId } : {}),
          egg: egg?.name || parsed.data.eggId,
          location: location?.name || parsed.data.locationId,
          memoryMb: Number(created.limits?.memoryMb || 0),
          diskMb: Number(created.limits?.diskMb || 0),
          cpuPercent: Number(created.limits?.cpuPercent || 0),
          backups: Number(created.limits?.backups || 0),
          databases: Number(created.limits?.databases || 0),
          allocations: Number(created.limits?.allocations || 0),
        }
      });

      return res.status(isQueued ? 202 : 201).json({ 
        server: {
          id: publicServerId,
          name: created.name,
          status: created.status,
          limits: {
            diskMb: Number(created.limits?.diskMb || 0),
            memoryMb: Number(created.limits?.memoryMb || 0),
            cpuPercent: Number(created.limits?.cpuPercent || 0),
            backups: Number(created.limits?.backups || 0),
            databases: Number(created.limits?.databases || 0),
            allocations: Number(created.limits?.allocations || 0),
          },
        },
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
      const publicServerId = server.publicId;

      await writeAudit(req, 'server.update', 'server', publicServerId, { 
        changes,
        serverId: publicServerId,
        serverName: server.name,
        userId: user.publicId
      });

      const formattedServer = server ? {
        id: publicServerId,
        name: server.name,
        status: server.status,
        limits: {
          diskMb: Number(server.limits?.diskMb || 0),
          memoryMb: Number(server.limits?.memoryMb || 0),
          cpuPercent: Number(server.limits?.cpuPercent || 0),
          backups: Number(server.limits?.backups || 0),
          databases: Number(server.limits?.databases || 0),
          allocations: Number(server.limits?.allocations || 0),
        },
      } : null;

      return res.json({ 
        server: formattedServer,
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
      const publicServerId = server.publicId;

      await writeAudit(req, 'server.delete', 'server', publicServerId, {
        serverId: publicServerId,
        serverName: server.name,
      });

      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  streamEvents(req, res, next) {
    try {
      const userId = extractUserId(req);
      const { subscribeLocalEvent } = require('../../lib/redis');

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (res.flushHeaders) res.flushHeaders();

      res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);
      if (res.flush) res.flush();

      const unsubscribe = subscribeLocalEvent(`user:${userId}:servers`, (payload) => {
        res.write(`data: ${payload}\n\n`);
        if (res.flush) res.flush();
      });

      const interval = setInterval(() => {
        res.write(': ping\n\n');
        if (res.flush) res.flush();
      }, 15000);

      req.on('close', () => {
        clearInterval(interval);
        unsubscribe();
        res.end();
      });
    } catch (error) {
      next(error);
    }
  }

  async createStreamTicket(req, res, next) {
    try {
      const crypto = require('crypto');
      const { setCache } = require('../../lib/redis');
      const userId = extractUserId(req);
      const ticket = `st_${crypto.randomBytes(24).toString('hex')}`;
      await setCache(`stream:ticket:${ticket}`, req.user || { sub: userId, userId }, 30);
      return res.json({ ticket, expiresIn: 30 });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServerController();
