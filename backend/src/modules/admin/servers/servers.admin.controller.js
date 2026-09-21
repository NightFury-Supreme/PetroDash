const { z } = require('zod');
const serversAdminService = require('./servers.admin.service');
const AppError = require('../../../utils/AppError');
const { writeAudit } = require('../../../middleware/audit');

const listServers = async (req, res, next) => {
  try {
    const result = await serversAdminService.listServers(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const listQueuedServers = async (req, res, next) => {
  try {
    const result = await serversAdminService.listQueuedServers(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const clearQueue = async (req, res, next) => {
  try {
    const result = await serversAdminService.clearQueue(req.query);
    await writeAudit(req, 'admin.server.queue.clear', 'server', null, { deletedCount: result.deletedCount });
    res.json({ success: result.success, count: result.count, message: result.message });
  } catch (error) {
    next(error);
  }
};

const getServerDetails = async (req, res, next) => {
  try {
    const result = await serversAdminService.getServerDetails(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateServer = async (req, res, next) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      throw new AppError('Invalid server ID format', 400, 'INVALID_FORMAT');
    }

    const schema = z.object({
      name: z.string().trim().min(1).max(100).optional(),
      limits: z.object({
        diskMb: z.coerce.number().int().min(0),
        memoryMb: z.coerce.number().int().min(0),
        cpuPercent: z.coerce.number().int().min(0),
        backups: z.coerce.number().int().min(0),
        databases: z.coerce.number().int().min(0),
        allocations: z.coerce.number().int().min(0),
      })
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Validation failed', 400, 'VALIDATION_FAILED');
    }

    const { limits, name } = parsed.data;
    if (!limits) {
      throw new AppError('Limits are required', 400, 'LIMITS_REQUIRED');
    }

    const { server, changes } = await serversAdminService.updateServer(req.params.id, { limits, name });

    await writeAudit(req, 'admin.server.update', 'server', server._id.toString(), { 
      serverId: server._id.toString(), 
      serverName: server.name,
      changes: Object.keys(changes).length > 0 ? changes : undefined
    });

    res.json(server);
  } catch (error) {
    next(error);
  }
};

const deleteServer = async (req, res, next) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      throw new AppError('Invalid server ID format', 400, 'INVALID_FORMAT');
    }

    const isForce = true;
    const server = await serversAdminService.deleteServer(req.params.id, isForce);

    await writeAudit(req, 'admin.server.delete', 'server', server._id.toString(), {
      serverId: server._id.toString(),
      serverName: server.name,
      ownerId: server.owner?.toString(),
      panelServerId: server.panelServerId,
      forced: isForce,
    });

    res.json({ message: 'Server deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listServers,
  listQueuedServers,
  clearQueue,
  getServerDetails,
  updateServer,
  deleteServer
};
