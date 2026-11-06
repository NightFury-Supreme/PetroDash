const User = require('../../models/User');
const Egg = require('../../models/Egg');
const Location = require('../../models/Location');
const Server = require('../../models/Server');
const { calculateUserTotalResources } = require('../../utils/resourceCalculator');
const { getEggDetails, createPanelServer } = require('../../services/pterodactyl');
const { acquireLock, releaseLock, publishEvent } = require('../../lib/redis');
const { invalidateServerCaches } = require('../../utils/serverCacheInvalidation');
const UserCreationService = require('../../services/userCreation');
const { sendMailTemplate } = require('../../lib/mail');
const AppError = require('../../utils/AppError');
const { buildIdFilter } = require('../../utils/publicId');

class ServerCreateService {
  async createServer(userId, payload, reqHost = '') {
    const lockToken = await acquireLock(`user:${userId}:server`, 15000);
    if (!lockToken) {
      throw new AppError('Another server operation is in progress. Please wait a moment and try again.', 429, 'ERR_SERVER_LOCKED');
    }

    const lockTimeout = new Date(Date.now() - 30000);
    const user = await User.findOneAndUpdate(
      {
        ...buildIdFilter(userId),
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
      await releaseLock(`user:${userId}:server`, lockToken);
      const exists = await User.findOne(buildIdFilter(userId)).lean();
      if (!exists) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
      throw new AppError('Another server operation is in progress. Please wait a moment and try again.', 429, 'ERR_SERVER_LOCKED');
    }

    try {

      if (!user.pterodactylUserId) {
        await UserCreationService.createPterodactylUser(user);
        if (!user.pterodactylUserId) {
          throw new AppError('The Pterodactyl panel is currently unreachable, so your account cannot be provisioned right now.', 503, 'ERR_PANEL_UNREACHABLE');
        }
      }

      const { name, eggId, locationId, limits } = payload;
      const [egg, location] = await Promise.all([
        Egg.findOne(buildIdFilter(eggId)).lean(),
        Location.findOne(buildIdFilter(locationId)).lean(),
      ]);
      if (!egg || !location) {
        throw AppError.badRequest('Invalid egg or location', 'ERR_INVALID_EGG_OR_LOCATION');
      }

      const { totalResources: userLimits, activePlans } = await calculateUserTotalResources(user);
      const planNames = activePlans.map(p => p?.planId?.name).filter(Boolean);
      const planPublicIds = activePlans.map(p => p?.planId?.publicId).filter(Boolean);
      const planTokens = new Set([...planNames, ...planPublicIds]);

      if (Array.isArray(egg.allowedPlans) && egg.allowedPlans.length > 0) {
        const allowed = egg.allowedPlans.some(ap => planTokens.has(String(ap)));
        if (!allowed) {
          throw AppError.forbidden('Your plan does not allow this egg type', 'ERR_EGG_PLAN_RESTRICTED');
        }
      }
      if (Array.isArray(location.allowedPlans) && location.allowedPlans.length > 0) {
        const allowed = location.allowedPlans.some(ap => planTokens.has(String(ap)));
        if (!allowed) {
          throw AppError.forbidden('Your plan does not allow this location', 'ERR_LOCATION_PLAN_RESTRICTED');
        }
      }

      const locationServerCount = await Server.countDocuments({ locationId: location._id });
      const locationLimit = Number(location.serverLimit || 0);
      if (locationLimit > 0 && locationServerCount >= locationLimit) {
        throw AppError.badRequest('Selected location is currently full. Please choose a different location.', 'ERR_LOCATION_FULL', {
          violations: { locationId: 'Location has reached its server capacity' }
        });
      }

      const existingServers = await Server.find({ owner: user._id }).select('limits').lean();
      const used = existingServers.reduce((acc, s) => {
        const l = s.limits || {};
        acc.diskMb += Number(l.diskMb || 0);
        acc.memoryMb += Number(l.memoryMb || 0);
        acc.cpuPercent += Number(l.cpuPercent || 0);
        acc.backups += Number(l.backups || 0);
        acc.databases += Number(l.databases || 0);
        acc.allocations += Number(l.allocations || 0);
        return acc;
      }, { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 });

      const remaining = {
        diskMb: Math.max(0, userLimits.diskMb - used.diskMb),
        memoryMb: Math.max(0, userLimits.memoryMb - used.memoryMb),
        cpuPercent: Math.max(0, userLimits.cpuPercent - used.cpuPercent),
        backups: Math.max(0, userLimits.backups - used.backups),
        databases: Math.max(0, userLimits.databases - used.databases),
        allocations: Math.max(0, userLimits.allocations - used.allocations),
        serverSlots: userLimits.serverSlots - existingServers.length,
      };

      const violations = {};
      if (remaining.serverSlots <= 0) violations.serverSlots = 'No server slots remaining';
      if (limits.diskMb > remaining.diskMb) violations.diskMb = `Exceeds remaining disk (${remaining.diskMb} MB available)`;
      if (limits.memoryMb > remaining.memoryMb) violations.memoryMb = `Exceeds remaining memory (${remaining.memoryMb} MB available)`;
      if (limits.cpuPercent > remaining.cpuPercent) violations.cpuPercent = `Exceeds remaining CPU (${remaining.cpuPercent}% available)`;
      if (limits.backups > remaining.backups) violations.backups = `Exceeds remaining backups (${remaining.backups} available)`;
      if (limits.databases > remaining.databases) violations.databases = `Exceeds remaining databases (${remaining.databases} available)`;
      if (limits.allocations > remaining.allocations) violations.allocations = `Exceeds remaining allocations (${remaining.allocations} available)`;

      if (Object.keys(violations).length > 0) {
        throw AppError.badRequest('Requested resources exceed your available limits', 'ERR_SERVER_LIMIT_EXCEEDED', { violations, remaining });
      }

      let startup = '';
      let dockerImage = '';
      const pteroVariables = {};
      try {
        const ed = await getEggDetails(egg.pterodactylNestId, egg.pterodactylEggId);
        startup = ed?.startup || '';
        dockerImage = ed?.docker_image || ed?.dockerImage || '';
        if (ed?.relationships?.variables?.data) {
          for (const v of ed.relationships.variables.data) {
            pteroVariables[v.attributes.env_variable] = String(v.attributes.default_value || '');
          }
        }
      } catch (_eggDetailsErr) { }

      const localEnv = Object.fromEntries((egg.env || []).map(v => [v.key, v.value]));
      const environment = { ...pteroVariables, ...localEnv };

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
          locations: [
            !isNaN(Number(location.platform?.platformLocationId)) && Number(location.platform?.platformLocationId) > 0
              ? Number(location.platform.platformLocationId)
              : 1
          ],
          dedicated_ip: false,
          port_range: [],
        },
        start_on_completion: true,
      };

      let panelServer;
      let isQueued = false;
      try {
        panelServer = await createPanelServer(panelPayload);
      } catch (_panelError) {
        isQueued = true;
      }

      const isPremium = activePlans && activePlans.length > 0;
      const created = await Server.create({
        owner: user._id,
        panelServerId: panelServer?.id || null,
        identifier: panelServer?.identifier || null,
        name,
        eggId: egg._id,
        locationId: location._id,
        limits,
        priority: isPremium ? 1 : 0,
        status: isQueued ? 'queued' : 'creating',
      });

      if (!isQueued) {
        this._sendServerCreatedEmail(user, created, egg, location, panelServer, reqHost).catch(() => { });
      }

      const publicServerId = created.publicId;
      await invalidateServerCaches({
        userId,
        publicServerId,
        eggId: egg?.publicId || null,
        locationId: location?.publicId || null,
      });
      await publishEvent(`user:${userId}:servers`, { type: 'SERVER_CREATED', serverId: publicServerId });

      return {
        created,
        panelServer,
        isQueued,
        user,
        egg,
        location,
      };
    } finally {
      await User.updateOne(buildIdFilter(userId), { $set: { serverLock: null } });
      await releaseLock(`user:${userId}:server`, lockToken);
    }
  }

  async _sendServerCreatedEmail(user, created, egg, location, panelServer, reqHost) {
    if (!user?.email) return;
    const backendUrl = (process.env.API_URL || process.env.BACKEND_URL || reqHost || '').replace(/\/$/, '');
    const frontendUrl = (process.env.FRONTEND_URL || backendUrl).replace(/\/$/, '');

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
        serverName: created.name,
        serverId: panelServer?.identifier || panelServer?.id || 'Pending',
        cpu: created.limits.cpuPercent,
        ram: created.limits.memoryMb,
        disk: created.limits.diskMb,
        ports: created.limits.allocations,
        databases: created.limits.databases,
        eggHtml,
        locationHtml,
        dashboardUrl: frontendUrl ? `${frontendUrl}/dashboard` : '/dashboard'
      },
    });
  }
}

module.exports = new ServerCreateService();
