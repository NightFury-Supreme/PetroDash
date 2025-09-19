const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../../middleware/auth');
const User = require('../../models/User');
const Egg = require('../../models/Egg');
const Location = require('../../models/Location');
const Server = require('../../models/Server');
const axios = require('axios');
const { getEggDetails } = require('../../services/pterodactyl');

const router = express.Router();
const { writeAudit } = require('../../middleware/audit');

const createSchema = z.object({
  name: z.string().min(1),
  eggId: z.string().min(1),
  locationId: z.string().min(1),
  limits: z.object({
    diskMb: z.coerce.number().int().min(100),
    memoryMb: z.coerce.number().int().min(128),
    cpuPercent: z.coerce.number().int().min(10),
    backups: z.coerce.number().int().min(0).default(0),
    databases: z.coerce.number().int().min(0).default(0),
    allocations: z.coerce.number().int().min(1),
  }),
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, eggId, locationId, limits } = parsed.data;
  const egg = await Egg.findById(eggId).lean();
  const location = await Location.findById(locationId).lean();
  if (!egg || !location) return res.status(400).json({ error: 'Invalid egg or location' });

  // Enforce plan-based access (if configured)
  try {
    const UserPlan = require('../../models/UserPlan');
    const activePlans = await UserPlan.find({ userId: req.user.sub, status: 'active' })
      .populate('planId', 'name')
      .lean();
    const planNames = activePlans.map(p => p?.planId?.name).filter(Boolean);
    const planIds = activePlans.map(p => String(p?.planId?._id || '')).filter(Boolean);
    const planTokens = new Set([...planNames, ...planIds]);

    if (Array.isArray(egg.allowedPlans) && egg.allowedPlans.length > 0) {
      const ok = egg.allowedPlans.some(ap => planTokens.has(String(ap)));
      if (!ok) return res.status(403).json({ error: 'Your plan does not allow this egg', violations: { eggId: 'Not allowed for your plan' } });
    }
    if (Array.isArray(location.allowedPlans) && location.allowedPlans.length > 0) {
      const ok = location.allowedPlans.some(ap => planTokens.has(String(ap)));
      if (!ok) return res.status(403).json({ error: 'Your plan does not allow this location', violations: { locationId: 'Not allowed for your plan' } });
    }
  } catch (_) {}

  // Enforce location capacity
  try {
    const serverCount = await Server.countDocuments({ locationId: location._id });
    const limit = Number(location.serverLimit || 0);
    if (limit > 0 && serverCount >= limit) {
      return res.status(400).json({ 
        error: 'Selected location is full', 
        violations: { locationId: 'Selected location has reached its server limit' },
        location: { serverCount, serverLimit: limit, locationId: location._id }
      });
    }
  } catch (_) {}

  // Enforce per-user limits: remaining capacity check
  // Compute effective user limits by adding active plan resources
  let userLimits = { ...(user.resources || {}) };
  try {
    const UserPlan = require('../../models/UserPlan');
    const activePlans = await UserPlan.find({ userId: user._id, status: 'active' }).lean();
    for (const up of activePlans) {
      const r = up.resources || {};
      userLimits.diskMb = Number(userLimits.diskMb || 0) + Number(r.diskMb || 0);
      userLimits.memoryMb = Number(userLimits.memoryMb || 0) + Number(r.memoryMb || 0);
      userLimits.cpuPercent = Number(userLimits.cpuPercent || 0) + Number(r.cpuPercent || 0);
      userLimits.backups = Number(userLimits.backups || 0) + Number(r.backups || 0);
      userLimits.databases = Number(userLimits.databases || 0) + Number(r.databases || 0);
      userLimits.allocations = Number(userLimits.allocations || 0) + Number(r.additionalAllocations || 0);
      userLimits.serverSlots = Number(userLimits.serverSlots || 0) + Number(r.serverLimit || 0);
    }
  } catch (_) {}
  const existing = await Server.find({ owner: user._id }).lean();
  const used = existing.reduce(
    (acc, s) => {
      const l = s.limits || {};
      acc.diskMb += Number(l.diskMb) || 0;
      acc.memoryMb += Number(l.memoryMb) || 0;
      acc.cpuPercent += Number(l.cpuPercent) || 0;
      acc.backups += Number(l.backups) || 0;
      acc.databases += Number(l.databases) || 0;
      acc.allocations += Number(l.allocations) || 0;
      return acc;
    },
    { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 }
  );

  const remaining = {
    diskMb: Math.max(0, Number(userLimits.diskMb || 0) - used.diskMb),
    memoryMb: Math.max(0, Number(userLimits.memoryMb || 0) - used.memoryMb),
    cpuPercent: Math.max(0, Number(userLimits.cpuPercent || 0) - used.cpuPercent),
    backups: Math.max(0, Number(userLimits.backups || 0) - used.backups),
    databases: Math.max(0, Number(userLimits.databases || 0) - used.databases),
    allocations: Math.max(0, Number(userLimits.allocations || 0) - used.allocations),
    serverSlots: Number(userLimits.serverSlots || 0) - existing.length,
  };

  const violations = {};
  if (remaining.serverSlots <= 0) violations.serverSlots = 'No server slots remaining';
  if (limits.diskMb > remaining.diskMb) violations.diskMb = `Exceeds remaining disk (${remaining.diskMb} MB)`;
  if (limits.memoryMb > remaining.memoryMb) violations.memoryMb = `Exceeds remaining memory (${remaining.memoryMb} MB)`;
  if (limits.cpuPercent > remaining.cpuPercent) violations.cpuPercent = `Exceeds remaining CPU (${remaining.cpuPercent}%)`;
  if (limits.backups > remaining.backups) violations.backups = `Exceeds remaining backups (${remaining.backups})`;
  if (limits.databases > remaining.databases) violations.databases = `Exceeds remaining databases (${remaining.databases})`;
  if (limits.allocations > remaining.allocations) violations.allocations = `Exceeds remaining allocations (${remaining.allocations})`;
  if (Object.keys(violations).length > 0) {
    return res.status(400).json({ error: 'Requested resources exceed your limits', violations, remaining, limits: userLimits });
  }

  let startup = '';
  let dockerImage = '';
  try {
    const ed = await getEggDetails(egg.pterodactylNestId, egg.pterodactylEggId);
    startup = ed?.startup || '';
    dockerImage = ed?.docker_image || ed?.dockerImage || '';
  } catch (_) {}

  const payload = {
    name,
    user: user.pterodactylUserId,
    egg: egg.pterodactylEggId,
    docker_image: dockerImage,
    startup: startup,
    environment: Object.fromEntries((egg.env || []).map(v => [v.key, v.value])),
    limits: {
      memory: limits.memoryMb,
      swap: 0,
      disk: limits.diskMb,
      io: 500,
      cpu: limits.cpuPercent,
    },
    feature_limits: {
      databases: limits.databases,
      allocations: limits.allocations,
      backups: limits.backups,
    },
    allocation: { default: 0 },
    deploy: {
      locations: [location.platform?.platformLocationId || location._id.toString()],
      dedicated_ip: false,
      port_range: [],
    },
    start_on_completion: true,
  };

  try {
    const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
    const resp = await axios.post(`${base}/api/application/servers`, payload, {
      headers: {
        Authorization: `Bearer ${process.env.PTERO_APP_API_KEY}`,
        Accept: 'Application/vnd.pterodactyl.v1+json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    const panelServer = resp.data?.attributes;
    const created = await Server.create({
      owner: user._id,
      panelServerId: panelServer?.id,
      name,
      eggId: egg._id,
      locationId: location._id,
      limits,
      status: 'active',
    });
    writeAudit(req, 'server.create', 'server', created._id.toString(), { panelServerId: panelServer?.id });
    // Notify user via email (non-blocking)
    try {
      const { sendMailTemplate } = require('../../lib/mail');
      await sendMailTemplate({
        to: user.email,
        templateKey: 'serverCreated',
        data: { serverName: name }
      });
    } catch (_) {}
    return res.status(201).json({ server: created, panel: panelServer });
  } catch (e) {
    console.error('Panel create server failed:', e?.response?.data || e.message);
    return res.status(502).json({ error: 'Panel server creation failed', details: e?.response?.data || e.message });
  }
});

module.exports = router;


