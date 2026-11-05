const service = require('./users.admin.service');
const securityService = require('./users.admin.security.service');
const sessionsService = require('./users.admin.sessions.service');
const AppError = require('../../../utils/AppError');
const {
  listUsersQuerySchema,
  updateUserSchema,
  banUserSchema,
  serverUpdateSchema,
  addPlanSchema,
  userActivityQuerySchema,
  sessionIdParamSchema,
  userParamSchema,
  verifyEmailSchema,
} = require('./users.admin.schema');

const listUsers = async (req, res, next) => {
  try {
    const parsed = listUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('Invalid query parameters', 400, 'ERR_USER_QUERY_INVALID', parsed.error.flatten());
    }
    const result = await service.listUsers(parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const result = await service.getUser(req.params.id, req.query);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid user payload', 400, 'ERR_USER_VALIDATION_FAILED', parsed.error.flatten());
    }
    const result = await service.updateUser(req, req.params.id, parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const banUser = async (req, res, next) => {
  try {
    const parsed = banUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid ban payload', 400, 'ERR_USER_BAN_INVALID', parsed.error.flatten());
    }
    const result = await service.banUser(req, req.params.id, parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const result = await service.deleteUser(req, req.params.id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const deleteServer = async (req, res, next) => {
  try {
    const result = await service.deleteServer(req, req.params.id, req.params.serverId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const getServer = async (req, res, next) => {
  try {
    const result = await service.getServer(req.params.id, req.params.serverId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateServer = async (req, res, next) => {
  try {
    const parsed = serverUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid server update payload', 400, 'ERR_SERVER_VALIDATION_FAILED', parsed.error.flatten());
    }
    const result = await service.updateServer(req, req.params.id, req.params.serverId, parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const addPlan = async (req, res, next) => {
  try {
    const parsed = addPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid plan assignment payload', 400, 'ERR_PLAN_VALIDATION_FAILED', parsed.error.flatten());
    }
    const result = await service.addPlan(req, req.params.id, parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const cancelPlans = async (req, res, next) => {
  try {
    const result = await service.cancelPlans(req, req.params.id, req.params.planId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const cancelPlanInstance = async (req, res, next) => {
  try {
    const result = await service.cancelPlanInstance(req, req.params.id, req.params.instanceId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const getUserActivity = async (req, res, next) => {
  try {
    const parsed = userActivityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('Invalid query parameters', 400, 'ERR_QUERY_INVALID', parsed.error.flatten());
    }
    const result = await service.getUserActivity(req.params.id, parsed.data);
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const avatarService = require('./users.admin.avatar.service');

const uploadUserAvatar = async (req, res, next) => {
  try {
    const result = await avatarService.uploadUserAvatar(req, req.params.id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const resetUserAvatar = async (req, res, next) => {
  try {
    const result = await avatarService.resetUserAvatar(req, req.params.id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const getUserSessions = async (req, res, next) => {
  try {
    const parsed = userParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError('Invalid user parameters', 400, 'ERR_PARAM_INVALID', parsed.error.flatten());
    }
    const result = await sessionsService.getUserSessions(parsed.data.id);
    return res.json({ success: true, sessions: result });
  } catch (error) {
    next(error);
  }
};

const revokeUserSession = async (req, res, next) => {
  try {
    const parsed = sessionIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError('Invalid session parameters', 400, 'ERR_PARAM_INVALID', parsed.error.flatten());
    }
    const result = await sessionsService.revokeUserSession(req, parsed.data.id, parsed.data.sessionId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const revokeAllUserSessions = async (req, res, next) => {
  try {
    const parsed = userParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError('Invalid user parameters', 400, 'ERR_PARAM_INVALID', parsed.error.flatten());
    }
    const result = await sessionsService.revokeAllUserSessions(req, parsed.data.id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const resetUser2FA = async (req, res, next) => {
  try {
    const parsed = userParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError('Invalid user parameters', 400, 'ERR_PARAM_INVALID', parsed.error.flatten());
    }
    const result = await securityService.resetUser2FA(req, parsed.data.id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const verifyUserEmail = async (req, res, next) => {
  try {
    const paramParsed = userParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new AppError('Invalid user parameters', 400, 'ERR_PARAM_INVALID', paramParsed.error.flatten());
    }
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid verification payload', 400, 'ERR_VALIDATION_FAILED', parsed.error.flatten());
    }
    const result = await securityService.verifyUserEmail(req, paramParsed.data.id, parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  getUser,
  getUserActivity,
  updateUser,
  banUser,
  deleteUser,
  deleteServer,
  getServer,
  updateServer,
  addPlan,
  cancelPlans,
  cancelPlanInstance,
  uploadUserAvatar,
  resetUserAvatar,
  getUserSessions,
  revokeUserSession,
  revokeAllUserSessions,
  resetUser2FA,
  verifyUserEmail,
};
