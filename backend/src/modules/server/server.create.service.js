/**
 * Server Creation Service
 * Enterprise provisioning logic with atomic locking, capacity checking,
 * Pterodactyl integration, and fallback queuing.
 */

const axios = require('axios');
const User = require('../../models/User');
const Egg = require('../../models/Egg');
const Location = require('../../models/Location');
const Server = require('../../models/Server');
const UserPlan = require('../../models/UserPlan');
const { getEggDetails } = require('../../services/pterodactyl');
const { deleteCache, deleteCachePattern } = require('../../lib/redis');
const UserCreationService = require('../../services/userCreation');
const { sendMailTemplate } = require('../../lib/mail');
const AppError = require('../../utils/AppError');

class ServerCreateService {
  async createServer(userId, payload, reqHost = '') {
    const lockTimeout = new Date(Date.now() - 30000);
    const user = await User.findOneAndUpdate(
      { 
        _id: userId, 
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
      const exists = await User.findById(userId).lean();
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
        Egg.findById(eggId).lean(),
        Location.findById(locationId).lean(),
      ]);
      if (!egg || !location) {
        throw AppError.badRequest('Invalid egg or location', 'ERR_INVALID_EGG_OR_LOCATION');
      }

      // Check plan restrictions
      const activePlans = await UserPlan.find({ userId: user._id, status: 'active' }).populate('planId', 'name').lean();
      const planNames = activePlans.map(p => p?.planId?.name).filter(Boolean);
      const planIds = activePlans.map(p => String(p?.planId?._id || '')).filter(Boolean);
      const planTokens = new Set([...planNames, ...planIds]);

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

      // Location server capacity
      const locationServerCount = await Server.countDocuments({ locationId: location._id });
      const locationLimit = Number(location.serverLimit || 0);
      if (locationLimit > 0 && locationServerCount >= locationLimit) {
        throw AppError.badRequest('Selected location is currently full. Please choose a different location.', 'ERR_LOCATION_FULL', {
          violations: { locationId: 'Location has reached its server capacity' }
        });
      }

      // Compute resource totals & usage
      const userLimits = {
        diskMb: Number(user.resources?.diskMb || 0),
        memoryMb: Number(user.resources?.memoryMb || 0),
        cpuPercent: Number(user.resources?.cpuPercent || 0),
        backups: Number(user.resources?.backups || 0),
        databases: Number(user.resources?.databases || 0),
        allocations: Number(user.resources?.allocations || 0),
        serverSlots: Number(user.resources?.serverSlots || 0),
      };

      for (const up of activePlans) {
        const r = up.resources || {};
        userLimits.diskMb += Number(r.diskMb || 0);
        userLimits.memoryMb += Number(r.memoryMb || 0);
        userLimits.cpuPercent += Number(r.cpuPercent || 0);
        userLimits.backups += Number(r.backups || 0);
        userLimits.databases += Number(r.databases || 0);
        userLimits.allocations += Number(r.additionalAllocations || 0);
        userLimits.serverSlots += Number(r.serverLimit || 0);
      }

      const existingServers = await Server.find({ owner: user._id }).lean();
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
      } catch (_) {}

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
        const errorStr = JSON.stringify(e?.response?.data || {}).toLowerCase();
        const isNodeIssue = errorStr.includes('not enough space') || 
                            errorStr.includes('no nodes satisfying') ||
                            errorStr.includes('offline') ||
                            errorStr.includes('allocations') ||
                            e.code === 'ECONNREFUSED' || 
                            e.code === 'ETIMEDOUT';
        if (isNodeIssue) {
          isQueued = true;
        } else {
          throw AppError.badRequest('Server creation on panel failed. Please try again or contact support.', 'ERR_PANEL_SERVER_CREATION_FAILED', e?.response?.data || e.message);
        }
      }

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

      // Send email template asynchronously
      this._sendServerCreatedEmail(user, created, egg, location, panelServer, reqHost).catch(() => {});

      // Invalidate caches
      await deleteCache(`user:${userId}:profile`);
      await deleteCachePattern(`api:servers:${userId}:*`);
      await deleteCachePattern(`server:usage:${userId}`);
      await deleteCachePattern('api:admin:servers:*');
      await deleteCache('eggs:counts');

      return {
        created,
        panelServer,
        isQueued,
        user
      };
    } finally {
      await User.updateOne({ _id: userId }, { $set: { serverLock: null } });
    }
  }

  async _sendServerCreatedEmail(user, created, egg, location, panelServer, reqHost) {
    if (!user?.email) return;
    const backendUrl = (process.env.API_URL || process.env.BACKEND_URL) 
      ? (process.env.API_URL || process.env.BACKEND_URL).replace(/\/$/, '')
      : reqHost;
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
        serverName: created.name,
        serverId: panelServer?.identifier || panelServer?.id || 'Pending',
        cpu: created.limits.cpuPercent,
        ram: created.limits.memoryMb,
        disk: created.limits.diskMb,
        ports: created.limits.allocations,
        databases: created.limits.databases,
        eggHtml,
        locationHtml,
        dashboardUrl: frontendUrl + '/dashboard'
      },
    });
  }
}

module.exports = new ServerCreateService();
