/* ==========================================================================
   Admin Servers Controller Layer
   Compliance: ISO/IEC 25010, OWASP Secure SDLC, Separation of Concerns
========================================================================== */

const serversAdminService = require('./servers.admin.service');
const AppError = require('../../../utils/AppError');
const { writeAudit } = require('../../../middleware/audit');
const {
  serverIdParamSchema,
  serverListQuerySchema,
  serverQueueQuerySchema,
  clearQueueQuerySchema,
  updateServerSchema,
  deleteServerQuerySchema,
} = require('./servers.admin.schema');

const listServers = async (req, res, next) => {
  try {
    const parsedQuery = serverListQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      throw new AppError('Invalid query parameters', 400, 'ERR_INVALID_QUERY_PARAMS');
    }
    const result = await serversAdminService.listServers(parsedQuery.data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const listQueuedServers = async (req, res, next) => {
  try {
    const parsedQuery = serverQueueQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      throw new AppError('Invalid query parameters', 400, 'ERR_INVALID_QUERY_PARAMS');
    }
    const result = await serversAdminService.listQueuedServers(parsedQuery.data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const clearQueue = async (req, res, next) => {
  try {
    const parsedQuery = clearQueueQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      throw new AppError('Invalid query parameters', 400, 'ERR_INVALID_QUERY_PARAMS');
    }
    const result = await serversAdminService.clearQueue(parsedQuery.data, req);
    await writeAudit(req, 'admin.server.queue.clear', 'server', null, { deletedCount: result.deletedCount });
    res.json({ success: result.success, count: result.count, message: result.message });
  } catch (error) {
    next(error);
  }
};

const getServerDetails = async (req, res, next) => {
  try {
    const parsedParams = serverIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      throw new AppError('Invalid server ID format', 400, 'ERR_INVALID_ID');
    }
    const result = await serversAdminService.getServerDetails(parsedParams.data.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateServer = async (req, res, next) => {
  try {
    const parsedParams = serverIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      throw new AppError('Invalid server ID format', 400, 'ERR_INVALID_ID');
    }

    const parsedBody = updateServerSchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw new AppError('Validation failed', 400, 'ERR_VALIDATION_FAILED');
    }

    const { limits, name } = parsedBody.data;
    if (!limits) {
      throw new AppError('Limits are required', 400, 'ERR_LIMITS_REQUIRED');
    }

    const { server, changes } = await serversAdminService.updateServer(parsedParams.data.id, { limits, name }, req);

    await writeAudit(req, 'admin.server.update', 'server', server._id.toString(), {
      serverId: server._id.toString(),
      serverName: server.name,
      ownerId: server.owner?.toString(),
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    });

    res.json(server);
  } catch (error) {
    next(error);
  }
};

const deleteServer = async (req, res, next) => {
  try {
    const parsedParams = serverIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      throw new AppError('Invalid server ID format', 400, 'ERR_INVALID_ID');
    }

    const parsedQuery = deleteServerQuerySchema.safeParse(req.query);
    const isForce = parsedQuery.success ? (parsedQuery.data.force ?? true) : true;

    const server = await serversAdminService.deleteServer(parsedParams.data.id, isForce, req);

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
  deleteServer,
};
