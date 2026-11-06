const User = require('../../../models/User');
const Server = require('../../../models/Server');
const UserPlan = require('../../../models/UserPlan');
const AppError = require('../../../utils/AppError');
const { getServer: getPanelServer } = require('../../../services/pterodactyl');
const { getCache, getCacheMany, getOrSetCache } = require('../../../lib/redis');
const avatarService = require('../../../services/avatarService');
const { isValidEntityId, isValidPublicId, buildIdFilter, formatPublicEntity } = require('../../../utils/publicId');

const mutationService = require('./users.admin.mutation.service');
const serversService = require('./users.admin.servers.service');
const plansService = require('./users.admin.plans.service');
const activityService = require('./users.admin.activity.service');

const listUsers = async ({ search, page = '1', limit = '10', pageSize, role, status, sortBy }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(pageSize || limit, 10) || 10));

  const cacheKey = `admin:users:${search || ''}:${role || 'all'}:${status || 'all'}:${sortBy || 'newest'}:${pageNum}:${limitNum}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      let filter = {};
      if (typeof search === 'string' && search.trim()) {
        const s = search.trim();
        const or = [{ email: { $regex: s, $options: 'i' } }, { username: { $regex: s, $options: 'i' } }];
        if (isValidPublicId(s, 'user')) {
          or.push({ publicId: s });
        }
        filter = { $or: or };
      }

      if (role && role !== 'all') filter.role = role;
      if (status === 'banned') {
        filter['ban.isBanned'] = true;
        filter.$and = [...(filter.$and || []), { $or: [{ 'ban.until': null }, { 'ban.until': { $gt: new Date() } }] }];
      } else if (status === 'active') {
        filter.$and = [...(filter.$and || []), {
          $or: [{ 'ban.isBanned': false }, { 'ban.isBanned': { $exists: false } }, { ban: { $exists: false } }, { 'ban.until': { $lte: new Date() } }],
        }];
      }

      const sortMap = { oldest: { createdAt: 1 }, username_asc: { username: 1 }, username_desc: { username: -1 }, coins_desc: { coins: -1 }, coins_asc: { coins: 1 } };
      const sort = sortMap[sortBy] || { createdAt: -1 };

      const total = await User.countDocuments(filter);
      const users = await User.find(filter, { passwordHash: 0, tfaSecret: 0, tfaBackupCodes: 0 })
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

      const userIds = users.map((u) => u._id);
      const servers = await Server.aggregate([
        { $match: { owner: { $in: userIds } } },
        { $group: { _id: '$owner', count: { $sum: 1 } } },
      ]);
      const idToCount = Object.fromEntries(servers.map((s) => [String(s._id), s.count]));
      const list = users.map((u) => {
        const formatted = formatPublicEntity(u, 'user');
        if (formatted.ban && formatted.ban.isBanned && formatted.ban.until && new Date(formatted.ban.until) <= new Date()) {
          formatted.ban.isBanned = false;
        }
        if (formatted.ban && formatted.ban.by) {
          formatted.ban.by = null;
        }
        if (formatted.referredBy) {
          formatted.referredBy = null;
        }
        return {
          ...formatted,
          serverCount: idToCount[String(u._id)] || 0,
          profilePicture: avatarService.resolveAvatar(u),
        };
      });

      return {
        data: list,
        meta: {
          total,
          currentPage: pageNum,
          pageSize: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      };
    },
    30
  );
};

const getUser = async (id, query = {}) => {
  if (!isValidEntityId(String(id), 'user')) {
    throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  }

  const referralPage = parseInt(query.referralPage, 10) || 1;
  const referralPageSize = parseInt(query.referralPageSize, 10) || 5;

  const user = await User.findOne(buildIdFilter(id), { passwordHash: 0, tfaSecret: 0, tfaBackupCodes: 0 })
    .populate('referredBy', 'username email referralCode publicId')
    .populate('ban.by', 'username publicId')
    .lean();
  if (!user) {
    throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  }

  const pubUserId = user.publicId;
  const cacheKey = `admin:users:detail:${pubUserId}:${referralPage}:${referralPageSize}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      const serversRaw = await Server.find({ owner: user._id })
        .populate('eggId', 'name icon publicId')
        .populate('locationId', 'name flag publicId')
        .lean();

      const base = (process.env.PTERO_BASE_URL || process.env.PTERODACTYL_URL || '').replace(/\/$/, '');
      const panelPingData = await getCache('ping:panel');
      const isPanelDown = Boolean(panelPingData && panelPingData.ping === -1);

      const uniqueLocationIds = [...new Set(serversRaw.map((s) => s.locationId?.publicId).filter(Boolean))];
      const pingKeys = uniqueLocationIds.map((locId) => `ping:${locId}`);
      const pingResults = pingKeys.length > 0 ? await getCacheMany(pingKeys) : [];
      const locationPingStatus = {};
      uniqueLocationIds.forEach((locId, idx) => {
        const nodePing = pingResults[idx];
        locationPingStatus[locId] = Boolean(nodePing && nodePing.ping === -1);
      });

      const servers = await Promise.all(
        serversRaw.map(async (s) => {
          let clientUrl = base;
          let isNodeDown = false;
          if (s.locationId && s.locationId.publicId) {
            isNodeDown = locationPingStatus[s.locationId.publicId] || false;
          }
          let isUnreachable = isPanelDown || isNodeDown;
          let isSuspended = s.status === 'suspended' || Boolean(s.suspended);

          if (!isUnreachable && s.panelServerId) {
            try {
              const panel = await getOrSetCache(`ptero:server:${s.panelServerId}`, () => getPanelServer(s.panelServerId), 60);
              const attrs = panel?.attributes || panel;
              const identifier = attrs?.identifier || attrs?.uuid || null;
              if (identifier) clientUrl = `${base}/server/${identifier}`;
              if (attrs?.suspended === true || attrs?.suspended === 1) {
                isSuspended = true;
              }
            } catch (_panelErr) {
              isUnreachable = true;
            }
          }
          return {
            ...s,
            status: s.status || 'unknown',
            clientUrl,
            suspended: isSuspended,
            unreachable: isUnreachable,
          };
        })
      );

      const usage = servers.reduce(
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

      const plans = await UserPlan.find({ userId: user._id, status: 'active' })
        .populate('planId', 'name pricePerMonth pricePerYear icon features publicId')
        .lean();

      const totalReferred = await User.countDocuments({ referredBy: user._id });
      const referredUsers = await User.find({ referredBy: user._id }, { passwordHash: 0, tfaSecret: 0, tfaBackupCodes: 0 })
        .skip((referralPage - 1) * referralPageSize)
        .limit(referralPageSize)
        .lean();

      const referralStats = user.referralStats || { referredCount: 0, coinsEarned: 0 };

      const loginMethod = user.oauthProviders?.discord?.id
        ? 'discord'
        : user.oauthProviders?.google?.id
        ? 'google'
        : 'email';

      const formattedServers = servers.map((s) => {
        const cleanServer = formatPublicEntity(s, 'server');
        cleanServer.owner = pubUserId;
        cleanServer.userId = pubUserId;
        if (cleanServer.eggId && typeof cleanServer.eggId === 'object') {
          cleanServer.eggId = formatPublicEntity(cleanServer.eggId, 'egg');
        }
        if (cleanServer.locationId && typeof cleanServer.locationId === 'object') {
          cleanServer.locationId = formatPublicEntity(cleanServer.locationId, 'location');
        }
        return cleanServer;
      });

      const formattedPlans = plans.map((p) => {
        const cleanPlan = formatPublicEntity(p, 'userPlan');
        cleanPlan.userId = pubUserId;
        if (cleanPlan.planId && typeof cleanPlan.planId === 'object') {
          cleanPlan.planId = formatPublicEntity(cleanPlan.planId, 'plan');
        }
        return cleanPlan;
      });

      const formattedReferredUsers = referredUsers.map((ru) => {
        const cleanRu = formatPublicEntity(ru, 'user');
        cleanRu.referredBy = pubUserId;
        if (cleanRu.ban && cleanRu.ban.by) cleanRu.ban.by = null;
        return cleanRu;
      });

      const formattedUser = formatPublicEntity(user, 'user');
      if (formattedUser.ban && formattedUser.ban.isBanned && formattedUser.ban.until && new Date(formattedUser.ban.until) <= new Date()) {
        formattedUser.ban.isBanned = false;
      }
      if (formattedUser.ban && formattedUser.ban.by && typeof formattedUser.ban.by === 'object') {
        formattedUser.ban.by = formatPublicEntity(formattedUser.ban.by, 'user');
      } else if (formattedUser.ban) {
        formattedUser.ban.by = null;
      }
      if (formattedUser.referredBy && typeof formattedUser.referredBy === 'object') {
        formattedUser.referredBy = formatPublicEntity(formattedUser.referredBy, 'user');
      } else {
        formattedUser.referredBy = null;
      }

      return {
        user: {
          ...formattedUser,
          profilePicture: avatarService.resolveAvatar(user),
          loginMethod,
          referralStats: {
            ...referralStats,
            referredCount: totalReferred,
          },
        },
        servers: formattedServers,
        usage,
        plans: formattedPlans,
        referral: {
          code: user.referralCode || null,
          coinsEarned: referralStats.coinsEarned || 0,
          referredCount: totalReferred,
          referredUsers: formattedReferredUsers,
          meta: {
            total: totalReferred,
            page: referralPage,
            pageSize: referralPageSize,
            totalPages: Math.ceil(totalReferred / referralPageSize),
          },
        },
        referrals: {
          items: formattedReferredUsers,
          total: totalReferred,
          page: referralPage,
          pageSize: referralPageSize,
          totalPages: Math.ceil(totalReferred / referralPageSize),
        },
      };
    },
    30
  );
};

const getUserActivity = activityService.getUserActivity;

module.exports = {
  listUsers,
  getUser,
  getUserActivity,
  updateUser: mutationService.updateUser,
  banUser: mutationService.banUser,
  deleteUser: mutationService.deleteUser,
  deleteServer: serversService.deleteServer,
  getServer: serversService.getServer,
  updateServer: serversService.updateServer,
  addPlan: plansService.addPlan,
  cancelPlans: plansService.cancelPlans,
  cancelPlanInstance: plansService.cancelPlanInstance,
};
