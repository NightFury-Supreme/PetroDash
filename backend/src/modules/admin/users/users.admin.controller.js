const { z } = require('zod');
const service = require('./users.admin.service');

const listUsers = async (req, res, next) => {
  try {
    const result = await service.listUsers(req.query);
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

const resourcesSchema = z.object({
  diskMb: z.coerce.number().int().min(0).optional(),
  memoryMb: z.coerce.number().int().min(0).optional(),
  cpuPercent: z.coerce.number().int().min(0).optional(),
  backups: z.coerce.number().int().min(0).optional(),
  databases: z.coerce.number().int().min(0).optional(),
  allocations: z.coerce.number().int().min(0).optional(),
  serverSlots: z.coerce.number().int().min(0).optional(),
}).partial();

const updateSchema = z.object({
  role: z.enum(['user','admin']).optional(),
  coins: z.coerce.number().int().min(0).optional(),
  resources: resourcesSchema.optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).max(32).optional(),
  firstName: z.string().min(1).max(64).optional(),
  lastName: z.string().min(1).max(64).optional(),
  referralCode: z.string().trim().min(1, 'Referral code cannot be empty').min(3, 'Referral code must be at least 3 characters').max(20).regex(/^[A-Za-z0-9_-]+$/, 'Referral code can only contain letters, numbers, hyphens and underscores').optional(),
  ban: z.object({ isBanned: z.boolean(), reason: z.string().trim().optional(), until: z.union([z.string().datetime().nullable(), z.null()]).optional() }).partial().optional(),
  profilePicture: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});

const updateUser = async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    const result = await service.updateUser(req, req.params.id, parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const banUser = async (req, res, next) => {
  try {
    const schema = z.object({
      isBanned: z.boolean(),
      reason: z.string().trim().optional(),
      durationMinutes: z.coerce.number().int().min(1).optional().nullable(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
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

const serverUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  limits: z.object({
    diskMb: z.coerce.number().int().min(100).optional(),
    memoryMb: z.coerce.number().int().min(128).optional(),
    cpuPercent: z.coerce.number().int().min(10).optional(),
    backups: z.coerce.number().int().min(0).optional(),
    databases: z.coerce.number().int().min(0).optional(),
    allocations: z.coerce.number().int().min(1).optional(),
  }).optional(),
});

const updateServer = async (req, res, next) => {
  try {
    const parsed = serverUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    const result = await service.updateServer(req, req.params.id, req.params.serverId, parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const addPlan = async (req, res, next) => {
  try {
    const schema = z.object({ planId: z.string().min(1), months: z.coerce.number().int() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
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

module.exports = {
  listUsers,
  getUser,
  updateUser,
  banUser,
  deleteUser,
  deleteServer,
  getServer,
  updateServer,
  addPlan,
  cancelPlans,
  cancelPlanInstance
};
