const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../../middleware/auth');
const User = require('../../models/User');
const Egg = require('../../models/Egg');
const Location = require('../../models/Location');
const Server = require('../../models/Server');
const UserPlan = require('../../models/UserPlan');
const axios = require('axios');
const { getEggDetails } = require('../../services/pterodactyl');
const { deleteCache, deleteCachePattern } = require('../../lib/redis');
const { writeAudit } = require('../../middleware/audit');
const UserCreationService = require('../../services/userCreation');
const { logUserActivity } = require('../../middleware/userActivity');
const { sendMailTemplate } = require('../../lib/mail');

const router = express.Router();
const { createRateLimiter } = require('../../middleware/rateLimit');

const createSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
  eggId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid egg ID'),
  locationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid location ID'),
  limits: z.object({
    diskMb: z.coerce.number().int().min(100).max(1000000),
    memoryMb: z.coerce.number().int().min(128).max(1000000),
    cpuPercent: z.coerce.number().int().min(10).max(1000),
    backups: z.coerce.number().int().min(0).max(1000).default(0),
    databases: z.coerce.number().int().min(0).max(1000).default(0),
    allocations: z.coerce.number().int().min(1).max(100),
  }),
});

// POST /api/servers
router.post('/', requireAuth, createRateLimiter(5, 60 * 1000), async (req, res) => {
  // 1. Validate input
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  // 2. Acquire atomic per-user lock to prevent TOCTOU race conditions
  //    (prevents spam-clicking from bypassing resource limits)
  //    A 30-second timeout lock ensures users aren't permanently locked out if a crash occurs.
  const lockTimeout = new Date(Date.now() - 30000);
  const user = await User.findOneAndUpdate(
    { 
      _id: req.user.sub, 
      $or: [
        { serverLock: { $exists: false } },
        { serverLock: null },
        { serverLock: { $lt: lockTimeout } }
      ]
    },
    { $set: { serverLock: new Date() } },
    { new: true }
  );

  if (!user) {
    const exists = await User.findById(req.user.sub).lean();
    if (!exists) return res.status(404).json({ error: 'User not found' });
    return res.status(429).json({ error: 'Another server operation is in progress. Please wait a moment and try again.' });
  }

  // 3. All further work is inside try/finally so the lock is ALWAYS released
  try {
    // 3.5. Just-In-Time Pterodactyl User Sync
    // If the user registered while the panel was offline, their panel account is pending.
    if (!user.pterodactylUserId) {
      
      await UserCreationService.createPterodactylUser(user);
      if (!user.pterodactylUserId) {
        return res.status(503).json({ 
          error: 'The Pterodactyl panel is currently unreachable, so your account cannot be provisioned right now. Please try again later.' 
        });
      }
    }

    const { name, eggId, locationId, limits } = parsed.data;

    // Fetch egg and location — validate they exist
    const [egg, location] = await Promise.all([
      Egg.findById(eggId).lean(),
      Location.findById(locationId).lean(),
    ]);
    if (!egg || !location) {
      return res.status(400).json({ error: 'Invalid egg or location' });
    }

    // 4. Enforce plan-based egg/location access restrictions
    const activePlans = await UserPlan.find({ userId: user._id, status: 'active' })
      .populate('planId', 'name')
      .lean();
    const planNames = activePlans.map(p => p?.planId?.name).filter(Boolean);
    const planIds = activePlans.map(p => String(p?.planId?._id || '')).filter(Boolean);
    const planTokens = new Set([...planNames, ...planIds]);

    if (Array.isArray(egg.allowedPlans) && egg.allowedPlans.length > 0) {
      const allowed = egg.allowedPlans.some(ap => planTokens.has(String(ap)));
      if (!allowed) {
        return res.status(403).json({ error: 'Your plan does not allow this egg type' });
      }
    }
    if (Array.isArray(location.allowedPlans) && location.allowedPlans.length > 0) {
      const allowed = location.allowedPlans.some(ap => planTokens.has(String(ap)));
      if (!allowed) {
        return res.status(403).json({ error: 'Your plan does not allow this location' });
      }
    }

    // 5. Enforce location server capacity limit
    const locationServerCount = await Server.countDocuments({ locationId: location._id });
    const locationLimit = Number(location.serverLimit || 0);
    if (locationLimit > 0 && locationServerCount >= locationLimit) {
      return res.status(400).json({
        error: 'Selected location is currently full. Please choose a different location.',
        violations: { locationId: 'Location has reached its server capacity' },
      });
    }

    // 6. Compute effective user resource totals (base + all active plan resources)
    const userLimits = {
      diskMb:      Number(user.resources?.diskMb      || 0),
      memoryMb:    Number(user.resources?.memoryMb    || 0),
      cpuPercent:  Number(user.resources?.cpuPercent  || 0),
      backups:     Number(user.resources?.backups     || 0),
      databases:   Number(user.resources?.databases   || 0),
      allocations: Number(user.resources?.allocations || 0),
      serverSlots: Number(user.resources?.serverSlots || 0),
    };

    // Add resources granted by active plans
    const planLimitPlans = await UserPlan.find({ userId: user._id, status: 'active' }).lean();
    for (const up of planLimitPlans) {
      const r = up.resources || {};
      userLimits.diskMb      += Number(r.diskMb               || 0);
      userLimits.memoryMb    += Number(r.memoryMb             || 0);
      userLimits.cpuPercent  += Number(r.cpuPercent           || 0);
      userLimits.backups     += Number(r.backups              || 0);
      userLimits.databases   += Number(r.databases            || 0);
      userLimits.allocations += Number(r.additionalAllocations || 0);
      userLimits.serverSlots += Number(r.serverLimit          || 0);
    }

    // 7. Compute already-used resources across all existing servers
    const existingServers = await Server.find({ owner: user._id }).lean();
    const used = existingServers.reduce(
      (acc, s) => {
        const l = s.limits || {};
        acc.diskMb      += Number(l.diskMb)      || 0;
        acc.memoryMb    += Number(l.memoryMb)    || 0;
        acc.cpuPercent  += Number(l.cpuPercent)  || 0;
        acc.backups     += Number(l.backups)     || 0;
        acc.databases   += Number(l.databases)   || 0;
        acc.allocations += Number(l.allocations) || 0;
        return acc;
      },
      { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 }
    );

    // 8. Calculate remaining capacity and check requested limits against it
    const remaining = {
      diskMb:      Math.max(0, userLimits.diskMb      - used.diskMb),
      memoryMb:    Math.max(0, userLimits.memoryMb    - used.memoryMb),
      cpuPercent:  Math.max(0, userLimits.cpuPercent  - used.cpuPercent),
      backups:     Math.max(0, userLimits.backups     - used.backups),
      databases:   Math.max(0, userLimits.databases   - used.databases),
      allocations: Math.max(0, userLimits.allocations - used.allocations),
      serverSlots: userLimits.serverSlots - existingServers.length,
    };

    const violations = {};
    if (remaining.serverSlots <= 0)            violations.serverSlots  = 'No server slots remaining';
    if (limits.diskMb      > remaining.diskMb)      violations.diskMb      = `Exceeds remaining disk (${remaining.diskMb} MB available)`;
    if (limits.memoryMb    > remaining.memoryMb)    violations.memoryMb    = `Exceeds remaining memory (${remaining.memoryMb} MB available)`;
    if (limits.cpuPercent  > remaining.cpuPercent)  violations.cpuPercent  = `Exceeds remaining CPU (${remaining.cpuPercent}% available)`;
    if (limits.backups     > remaining.backups)     violations.backups     = `Exceeds remaining backups (${remaining.backups} available)`;
    if (limits.databases   > remaining.databases)   violations.databases   = `Exceeds remaining databases (${remaining.databases} available)`;
    if (limits.allocations > remaining.allocations) violations.allocations = `Exceeds remaining allocations (${remaining.allocations} available)`;

    if (Object.keys(violations).length > 0) {
      return res.status(400).json({
        error: 'Requested resources exceed your available limits',
        violations,
        remaining,
      });
    }

    // 9. Fetch egg startup/docker details from Pterodactyl
    let startup = '';
    let dockerImage = '';
    let pteroVariables = {};
    try {
      const ed = await getEggDetails(egg.pterodactylNestId, egg.pterodactylEggId);
      startup = ed?.startup || '';
      dockerImage = ed?.docker_image || ed?.dockerImage || '';
      
      if (ed?.relationships?.variables?.data) {
        for (const v of ed.relationships.variables.data) {
          pteroVariables[v.attributes.env_variable] = String(v.attributes.default_value || '');
        }
      }
     
    } catch (_) {
      // Non-fatal: panel may still accept defaults
    }

    const localEnv = Object.fromEntries((egg.env || []).map(v => [v.key, v.value]));
    const environment = { ...pteroVariables, ...localEnv };

    // 10. Submit server creation request to Pterodactyl panel
    const panelPayload = {
      name,
      user: user.pterodactylUserId,
      egg: egg.pterodactylEggId,
      docker_image: dockerImage,
      startup,
      environment,
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

    let panelServer;
    let isQueued = false;
    try {
      const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
      const resp = await axios.post(`${base}/api/application/servers`, panelPayload, {
        headers: {
          Authorization: `Bearer ${process.env.PTERO_APP_API_KEY}`,
          Accept: 'Application/vnd.pterodactyl.v1+json',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
      panelServer = resp.data?.attributes;
    } catch (e) {
      console.error('Pterodactyl server creation failed:', e?.response?.data || e.message);
      
      const errorStr = JSON.stringify(e?.response?.data || {}).toLowerCase();
      // If node is offline, full, or connection refused, queue it instead of rejecting
      const isNodeIssue = errorStr.includes('not enough space') || 
                          errorStr.includes('no nodes satisfying') ||
                          errorStr.includes('offline') ||
                          errorStr.includes('allocations') ||
                          e.code === 'ECONNREFUSED' || 
                          e.code === 'ETIMEDOUT';
                          
      if (isNodeIssue) {
        isQueued = true;
      } else {
        return res.status(400).json({
          error: 'Server creation on panel failed. Please try again or contact support.',
          details: e?.response?.data || e.message,
        });
      }
    }

    // 11. Persist server record in our database
    const isPremium = activePlans && activePlans.length > 0;
    const created = await Server.create({
      owner: user._id,
      panelServerId: panelServer?.id,
      name,
      eggId: egg._id,
      locationId: location._id,
      limits,
      priority: isPremium ? 1 : 0,
      status: isQueued ? 'queued' : 'active',
    });

    
    await logUserActivity(req, 'server.create', { 
      serverName: name, 
      serverId: panelServer?.id, 
      dbId: created._id.toString(),
      created: {
        serverName: name,
        serverId: panelServer?.id,
        ...limits 
      }
    });

    writeAudit(req, 'server.create', 'server', created._id.toString(), {
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

    // 12. Send confirmation email (non-blocking, failure is not fatal)
    try {
      
      
      const backendUrl = (process.env.API_URL || process.env.BACKEND_URL) 
        ? (process.env.API_URL || process.env.BACKEND_URL).replace(/\/$/, '')
        : `${req.protocol}://${req.get('host')}`;
        
      const frontendUrl = process.env.FRONTEND_URL 
        ? process.env.FRONTEND_URL.replace(/\/$/, '') 
        : backendUrl;
      
      let locationHtml = location.name || 'Unknown';
      if (location.flag) {
        const flagUrl = location.flag.startsWith('http') ? location.flag : `${backendUrl}${location.flag.startsWith('/') ? '' : '/'}${location.flag}`;
        locationHtml = `<img src="${flagUrl}" alt="" style="height: 14px; width: 20px; border-radius: 2px; vertical-align: middle; margin-top: -2px; margin-right: 8px; object-fit: cover;" />${location.name}`;
      }

      let eggHtml = egg.name || 'Unknown';
      if (egg.icon) {
        const iconUrl = egg.icon.startsWith('http') ? egg.icon : `${backendUrl}${egg.icon.startsWith('/') ? '' : '/'}${egg.icon}`;
        eggHtml = `<img src="${iconUrl}" alt="" style="height: 18px; width: 18px; vertical-align: middle; margin-top: -2px; margin-right: 8px; object-fit: contain;" />${egg.name}`;
      }

      await sendMailTemplate({
        to: user.email,
        templateKey: 'serverCreated',
        data: { 
          username: user.username,
          serverName: name,
          serverId: panelServer?.identifier || panelServer?.id || 'Pending',
          cpu: limits.cpuPercent,
          ram: limits.memoryMb,
          disk: limits.diskMb,
          ports: limits.allocations,
          databases: limits.databases,
          eggHtml,
          locationHtml,
          dashboardUrl: frontendUrl + '/dashboard'
        },
      });
     
    } catch (_) {}

    // Invalidate user profile cache and server lists
    await deleteCache(`user:${req.user.sub}:profile`);
    await deleteCachePattern(`api:servers:${req.user.sub}:*`);
    await deleteCachePattern(`server:usage:${req.user.sub}`);
    await deleteCachePattern('api:admin:servers:*');
    await deleteCache('eggs:counts');

    return res.status(isQueued ? 202 : 201).json({ 
      server: created, 
      panel: panelServer,
      queued: isQueued,
      message: isQueued ? 'Node is currently full or offline. Your server has been added to the queue and will be created automatically when resources become available.' : 'Server created successfully.'
    });

  } finally {
    // ALWAYS release the lock, even if an error or early return occurred above
    await User.updateOne({ _id: req.user.sub }, { $set: { serverLock: null } });
  }
});

module.exports = router;
