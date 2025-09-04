const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const User = require('../../models/User');
const Server = require('../../models/Server');
const UserPlan = require('../../models/UserPlan');
const Plan = require('../../models/Plan');
const { deleteServer: deletePanelServer, updateServerBuild, getServer: getPanelServer, updateServerDetails, deletePanelUser } = require('../../services/pterodactyl');

const router = express.Router();

// GET /api/admin/users - list users
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};
    if (typeof search === 'string' && search.trim()) {
      const s = search.trim();
      const or = [{ email: { $regex: s, $options: 'i' } }, { username: { $regex: s, $options: 'i' } }];
      // If valid ObjectId, include _id exact match
      try {
        const { Types } = require('mongoose');
        if (Types.ObjectId.isValid(s)) {
          or.push({ _id: s });
        }
      } catch {}
      filter = { $or: or };
    }
    const users = await User.find(filter, { passwordHash: 0 }).lean();
    // count servers per user
    const servers = await Server.aggregate([
      { $group: { _id: '$owner', count: { $sum: 1 } } },
    ]);
    const idToCount = Object.fromEntries(servers.map((s) => [String(s._id), s.count]));
    const list = users.map((u) => ({ ...u, serverCount: idToCount[String(u._id)] || 0 }));
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to list users' });
  }
});

// GET /api/admin/users/:id - user details with servers and usage
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    
    const user = await User.findById(req.params.id, { passwordHash: 0 }).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const servers = await Server.find({ owner: user._id })
      .populate('eggId', 'name iconUrl')
      .populate('locationId', 'name')
      .lean();

    const usage = servers.reduce((acc, s) => {
      const l = s.limits || {};
      acc.diskMb += Number(l.diskMb) || 0;
      acc.memoryMb += Number(l.memoryMb) || 0;
      acc.cpuPercent += Number(l.cpuPercent) || 0;
      acc.backups += Number(l.backups) || 0;
      acc.databases += Number(l.databases) || 0;
      acc.allocations += Number(l.allocations) || 0;
      return acc;
    }, { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 });

    // Active plans
    const plans = await UserPlan.find({ userId: user._id, status: 'active' })
      .populate('planId', 'name pricePerMonth pricePerYear')
      .lean();

    console.log('Plans found:', plans.length);

        return res.json({ user, servers, usage, plans });
  } catch (e) {
    console.error('Error loading user:', e);
    return res.status(500).json({ error: 'Failed to load user', details: e.message });
  }
});

// PATCH /api/admin/users/:id - update role/resources
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
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { role, resources, coins, email, username, firstName, lastName } = parsed.data;
  if (role) user.role = role;
  if (typeof coins === 'number') user.coins = coins;
  // Direct resource editing: update user.resources directly
  if (resources) user.resources = { ...(user.resources || {}), ...resources };
  if (email) user.email = email;
  if (username) user.username = username;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  await user.save();
  const { writeAudit } = require('../../middleware/audit');
  writeAudit(req, 'admin.user.update', 'user', user._id.toString(), { role, resources, coins, email, username, firstName, lastName });
  return res.json({ user });
});

// DELETE /api/admin/users/:id - delete user and all servers
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const servers = await Server.find({ owner: user._id });
    let deletedServers = 0;
    let serverErrors = [];
    
    // Step 1: Delete all servers
    for (const server of servers) {
      try {
        await deletePanelServer(server.panelServerId);
        await Server.deleteOne({ _id: server._id });
        deletedServers++;
      } catch (error) {
        serverErrors.push({ serverId: server._id, serverName: server.name, error: error.message });
        console.error(`Failed to delete server ${server._id}:`, error.message);
      }
    }
    
    // Step 2: Delete Pterodactyl user account
    let pterodactylError = null;
    if (user.pterodactylUserId) {
      try {
        await deletePanelUser(user.pterodactylUserId);
      } catch (error) {
        pterodactylError = error.message;
        console.error(`Failed to delete Pterodactyl user ${user.pterodactylUserId}:`, error.message);
      }
    }
    
    // Step 3: Delete dashboard user
    await User.deleteOne({ _id: user._id });
    
    const { writeAudit } = require('../../middleware/audit');
    writeAudit(req, 'admin.user.delete', 'user', user._id.toString(), { 
      serversDeleted: deletedServers, 
      serverErrors: serverErrors.length,
      pterodactylError: !!pterodactylError 
    });
    
    // Return success with any errors that occurred
    return res.json({ 
      ok: true, 
      serversDeleted: deletedServers,
      totalServers: servers.length,
      serverErrors,
      pterodactylError,
      message: serverErrors.length > 0 || pterodactylError 
        ? 'User deleted but some cleanup operations failed. Check server logs for details.'
        : 'User and all associated data deleted successfully.'
    });
  } catch (error) {
    console.error('User deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

// DELETE /api/admin/users/:id/servers/:serverId - delete specific server of user
router.delete('/:id/servers/:serverId', requireAdmin, async (req, res) => {
  const server = await Server.findOne({ _id: req.params.serverId, owner: req.params.id });
  if (!server) return res.status(404).json({ error: 'Server not found' });
  try { await deletePanelServer(server.panelServerId); } catch (e) {
    return res.status(502).json({ error: 'Panel delete failed', details: e?.response?.data || e.message });
  }
  await Server.deleteOne({ _id: server._id });
  const { writeAudit } = require('../../middleware/audit');
  writeAudit(req, 'admin.user.server.delete', 'server', server._id.toString(), { owner: req.params.id });
  return res.json({ ok: true });
});

// GET /api/admin/users/:id/servers/:serverId - view server with client URL and panel-synced limits
router.get('/:id/servers/:serverId', requireAdmin, async (req, res) => {
  try {
    const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
    const server = await Server.findOne({ _id: req.params.serverId, owner: req.params.id })
      .populate('eggId', 'name iconUrl')
      .populate('locationId', 'name')
      .lean();
    if (!server) return res.status(404).json({ error: 'Server not found' });
    let clientUrl = base;
    try {
      const panel = await getPanelServer(server.panelServerId);
      const identifier = panel?.identifier || panel?.uuid || null;
      if (identifier) clientUrl = `${base}/server/${identifier}`;
      const panelBuild = panel?.limits || panel?.build || {};
      const panelFeatures = panel?.feature_limits || {};
      const updatedLimits = {
        diskMb: Number(panelBuild.disk) ?? server.limits?.diskMb,
        memoryMb: Number(panelBuild.memory) ?? server.limits?.memoryMb,
        cpuPercent: Number(panelBuild.cpu) ?? server.limits?.cpuPercent,
        backups: Number(panelFeatures.backups) ?? server.limits?.backups,
        databases: Number(panelFeatures.databases) ?? server.limits?.databases,
        allocations: Number(panelFeatures.allocations) ?? server.limits?.allocations,
      };
      const hasChange = ['diskMb','memoryMb','cpuPercent','backups','databases','allocations'].some(k => Number(server.limits?.[k] || 0) !== Number(updatedLimits[k] || 0));
      if (hasChange) await Server.updateOne({ _id: server._id }, { $set: { limits: updatedLimits } });
      return res.json({ ...server, limits: updatedLimits, clientUrl });
    } catch (_) {
      return res.json({ ...server, clientUrl });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load server' });
  }
});

// PATCH /api/admin/users/:id/servers/:serverId - update server limits/name
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

router.patch('/:id/servers/:serverId', requireAdmin, async (req, res) => {
  const parsed = serverUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  const server = await Server.findOne({ _id: req.params.serverId, owner: req.params.id });
  if (!server) return res.status(404).json({ error: 'Server not found' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const desired = parsed.data;
  if (desired.limits) {
    const { computeEffectiveLimits } = require('../../lib/limits');
    const userLimits = await computeEffectiveLimits(user._id);
    const others = await Server.find({ owner: user._id, _id: { $ne: server._id } }).lean();
    const used = others.reduce((acc, s) => {
      const l = s.limits || {};
      acc.diskMb += Number(l.diskMb) || 0;
      acc.memoryMb += Number(l.memoryMb) || 0;
      acc.cpuPercent += Number(l.cpuPercent) || 0;
      acc.backups += Number(l.backups) || 0;
      acc.databases += Number(l.databases) || 0;
      acc.allocations += Number(l.allocations) || 0;
      return acc;
    }, { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 });

    const remaining = {
      diskMb: Math.max(0, Number(userLimits.diskMb || 0) - used.diskMb),
      memoryMb: Math.max(0, Number(userLimits.memoryMb || 0) - used.memoryMb),
      cpuPercent: Math.max(0, Number(userLimits.cpuPercent || 0) - used.cpuPercent),
      backups: Math.max(0, Number(userLimits.backups || 0) - used.backups),
      databases: Math.max(0, Number(userLimits.databases || 0) - used.databases),
      allocations: Math.max(0, Number(userLimits.allocations || 0) - used.allocations),
    };

    const newLimits = { ...server.limits, ...desired.limits };
    const violations = {};
    if (newLimits.diskMb > remaining.diskMb) violations.diskMb = `Exceeds remaining disk (${remaining.diskMb} MB)`;
    if (newLimits.memoryMb > remaining.memoryMb) violations.memoryMb = `Exceeds remaining memory (${remaining.memoryMb} MB)`;
    if (newLimits.cpuPercent > remaining.cpuPercent) violations.cpuPercent = `Exceeds remaining CPU (${remaining.cpuPercent}%)`;
    if (newLimits.backups > remaining.backups) violations.backups = `Exceeds remaining backups (${remaining.backups})`;
    if (newLimits.databases > remaining.databases) violations.databases = `Exceeds remaining databases (${remaining.databases})`;
    if (newLimits.allocations > remaining.allocations) violations.allocations = `Exceeds remaining allocations (${remaining.allocations})`;
    if (Object.keys(violations).length > 0) return res.status(400).json({ error: 'Requested resources exceed limits', violations, remaining, limits: userLimits });

    try {
      const panel = await getPanelServer(server.panelServerId);
      const currentAllocationId = panel?.allocation || panel?.relationships?.allocation?.attributes?.id || 0;
      await updateServerBuild(server.panelServerId, {
        allocation: currentAllocationId,
        memory: newLimits.memoryMb,
        swap: 0,
        disk: newLimits.diskMb,
        io: 500,
        cpu: newLimits.cpuPercent,
        databases: newLimits.databases,
        allocations: newLimits.allocations,
        backups: newLimits.backups,
      });
      server.limits = newLimits;
    } catch (e) {
      return res.status(502).json({ error: 'Panel update failed', details: e?.response?.data || e.message });
    }
  }

  if (typeof desired.name === 'string' && desired.name.trim()) {
    try {
      await updateServerDetails(server.panelServerId, { name: desired.name.trim(), user: user.pterodactylUserId, external_id: user._id.toString() });
      server.name = desired.name.trim();
    } catch (e) {
      return res.status(502).json({ error: 'Panel rename failed', details: e?.response?.data || e.message });
    }
  }

  await server.save();
  const { writeAudit } = require('../../middleware/audit');
  writeAudit(req, 'admin.user.server.update', 'server', server._id.toString(), { owner: req.params.id, changed: desired });
  return res.json({ server });
});

module.exports = router;

// POST /api/admin/users/:id/plans - add a plan to user (months>0 adds, negative removes time)
router.post('/:id/plans', requireAdmin, async (req, res) => {
  const schema = z.object({ planId: z.string().min(1), months: z.coerce.number().int() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  const { planId, months } = parsed.data;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const plan = await Plan.findById(planId);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  const now = new Date();
  let expiresAt = null;
  
  // Handle lifetime plans
  if (plan.billingOptions?.lifetime) {
    expiresAt = null; // Lifetime plans don't expire
  } else {
    expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + Math.max(0, months));
  }
  
  // Create a new UserPlan instance (allows multiple instances of the same plan)
  const sub = await UserPlan.create({ 
    userId: user._id, 
    planId: plan._id, 
    purchaseDate: now,
    expiresAt, 
    status: 'active',
    billingCycle: plan.billingOptions?.lifetime ? 'lifetime' : 'monthly',
    amount: plan.billingOptions?.lifetime ? plan.pricePerMonth : plan.pricePerMonth * months,
    resources: plan.productContent,
    isRenewable: plan.billingOptions?.renewable || false,
    isLifetime: plan.billingOptions?.lifetime || false
  });

  // Apply one-time benefits immediately
  const productContent = plan.productContent || {};
  
  // Add coins
  user.coins = Number(user.coins || 0) + Number(productContent.coins || 0);
  
  // Add all resources to user resources
  if (!user.resources) user.resources = {};
  
  // Add recurrent resources (monthly benefits)
  const recurrentResources = productContent.recurrentResources || {};
  user.resources.diskMb = Number(user.resources.diskMb || 0) + Number(recurrentResources.diskMb || 0);
  user.resources.memoryMb = Number(user.resources.memoryMb || 0) + Number(recurrentResources.memoryMb || 0);
  user.resources.cpuPercent = Number(user.resources.cpuPercent || 0) + Number(recurrentResources.cpuPercent || 0);
  
  // Add additional resources (one-time benefits)
  user.resources.backups = Number(user.resources.backups || 0) + Number(productContent.backups || 0);
  user.resources.databases = Number(user.resources.databases || 0) + Number(productContent.databases || 0);
  user.resources.allocations = Number(user.resources.allocations || 0) + Number(productContent.additionalAllocations || 0);
  user.resources.serverSlots = Number(user.resources.serverSlots || 0) + Number(productContent.serverLimit || 0);
  
  await user.save();

  const { writeAudit } = require('../../middleware/audit');
  writeAudit(req, 'admin.user.plan.add', 'user_plan', sub._id.toString(), { plan: plan.name, months });
  return res.json({ plan: sub });
});

// DELETE /api/admin/users/:id/plans/:planId - cancel/remove user's plan
router.delete('/:id/plans/:planId', requireAdmin, async (req, res) => {
  // Find all active UserPlan instances for this plan
  const subs = await UserPlan.find({ userId: req.params.id, planId: req.params.planId, status: 'active' });
  if (subs.length === 0) return res.status(404).json({ error: 'Active plan not found' });
  
  // Cancel all instances
  for (const sub of subs) {
    sub.status = 'cancelled';
    await sub.save();
  }
  
  const { writeAudit } = require('../../middleware/audit');
  writeAudit(req, 'admin.user.plan.cancel', 'user_plan', req.params.planId, { userId: req.params.id, planId: req.params.planId, instancesCancelled: subs.length });
  return res.json({ ok: true, instancesCancelled: subs.length });
});

// DELETE /api/admin/users/:id/plans/instance/:instanceId - cancel/remove specific plan instance
router.delete('/:id/plans/instance/:instanceId', requireAdmin, async (req, res) => {
  const sub = await UserPlan.findOne({ _id: req.params.instanceId, userId: req.params.id, status: 'active' });
  if (!sub) return res.status(404).json({ error: 'Active plan instance not found' });
  
  sub.status = 'cancelled';
  await sub.save();
  
  const { writeAudit } = require('../../middleware/audit');
  writeAudit(req, 'admin.user.plan.instance.cancel', 'user_plan', sub._id.toString(), { userId: req.params.id, planId: sub.planId });
  return res.json({ ok: true });
});




