const { Types } = require('mongoose');
const User = require('../../../models/User');
const Server = require('../../../models/Server');
const UserPlan = require('../../../models/UserPlan');
const Plan = require('../../../models/Plan');
const PendingUpdate = require('../../../models/PendingUpdate');
const AppError = require('../../../../utils/AppError');
const { deleteServer: deletePanelServer, updateServerBuild, getServer: getPanelServer, updateServerDetails, deletePanelUser, checkUserExists, updatePanelUser, suspendServer, unsuspendServer } = require('../../../services/pterodactyl');
const { getCache, setCache, deleteCachePattern } = require('../../../lib/redis');
const { sendMailTemplate } = require('../../../lib/mail');
const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');
const { computeEffectiveLimits } = require('../../../lib/limits');

const listUsers = async ({ search, page = '1', limit = '10', pageSize }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(pageSize || limit, 10) || 10));
  
  const cacheKey = `admin:users:${search || ''}:${pageNum}:${limitNum}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  let filter = {};
  if (typeof search === 'string' && search.trim()) {
    const s = search.trim();
    const or = [{ email: { $regex: s, $options: 'i' } }, { username: { $regex: s, $options: 'i' } }];
    try {
      if (Types.ObjectId.isValid(s)) {
        or.push({ _id: s });
      }
    } catch {}
    filter = { $or: or };
  }
  
  const total = await User.countDocuments(filter);
  const users = await User.find(filter, { passwordHash: 0 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();
    
  const userIds = users.map(u => u._id);
  const servers = await Server.aggregate([
    { $match: { owner: { $in: userIds } } },
    { $group: { _id: '$owner', count: { $sum: 1 } } },
  ]);
  const idToCount = Object.fromEntries(servers.map((s) => [String(s._id), s.count]));
  const list = users.map((u) => ({ ...u, serverCount: idToCount[String(u._id)] || 0 }));
  
  const result = {
    data: list,
    meta: {
      total,
      currentPage: pageNum,
      pageSize: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };

  await setCache(cacheKey, result, 30);
  return result;
};

const getUser = async (id, query) => {
  const user = await User.findById(String(id), { passwordHash: 0 })
    .populate('referredBy', 'username email referralCode')
    .lean();
  if (!user) {
    throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  }

  const serversRaw = await Server.find({ owner: user._id })
    .populate('eggId', 'name icon')
    .populate('locationId', 'name flag')
    .lean();

  let base = process.env.PTERO_BASE_URL || process.env.PTERODACTYL_URL || '';
  if (base.endsWith('/')) base = base.slice(0, -1);

  const servers = await Promise.all(serversRaw.map(async (s) => {
    let clientUrl = base;
    if (s.panelServerId) {
      try {
        const panel = await getPanelServer(s.panelServerId);
        const identifier = panel?.attributes?.identifier || panel?.attributes?.uuid || panel?.identifier || panel?.uuid || null;
        if (identifier) clientUrl = `${base}/server/${identifier}`;
      } catch (_) {}
    }
    return { ...s, clientUrl };
  }));

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

  const plans = await UserPlan.find({ userId: user._id, status: 'active' })
    .populate('planId', 'name pricePerMonth pricePerYear')
    .lean();

  const referralPage = parseInt(query.referralPage) || 1;
  const referralPageSize = parseInt(query.referralPageSize) || 5;

  const totalReferred = await User.countDocuments({ referredBy: user._id });
  const referredUsers = await User.find({ referredBy: user._id }, { passwordHash: 0 })
    .select('username email createdAt')
    .skip((referralPage - 1) * referralPageSize)
    .limit(referralPageSize)
    .lean();
    
  const referralStats = user.referralStats || { referredCount: 0, coinsEarned: 0 };

  const loginMethod = user.passwordHash ? 'email' : 
                     user.oauthProviders?.discord?.id ? 'discord' : 
                     user.oauthProviders?.google?.id ? 'google' : 'email';

  return { 
    user, 
    servers, 
    usage, 
    plans,
    loginMethod: loginMethod,
    oauthProviders: user.oauthProviders || {},
    ban: user.ban || { isBanned: false, reason: '', until: null },
    referral: {
      code: user.referralCode || null,
      referredCount: Number(referralStats.referredCount || 0),
      coinsEarned: Number(referralStats.coinsEarned || 0),
      referredUsers,
      meta: {
        total: totalReferred,
        currentPage: referralPage,
        pageSize: referralPageSize,
        totalPages: Math.ceil(totalReferred / referralPageSize)
      }
    }
  };
};

const updateUser = async (req, id, data) => {
  const isSelf = String(id) === String(req.user?.sub || req.user?.userId);

  if (isSelf) {
    if (data?.role && data.role !== 'admin') {
      throw new AppError('You cannot demote your own admin role.', 403, 'ERR_ADMIN_SELF_DEMOTE');
    }
    if (data?.ban?.isBanned === true) {
      throw new AppError('You cannot ban your own account.', 403, 'ERR_ADMIN_SELF_BAN');
    }
  }

  const user = await User.findById(String(id));
  if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  
  const originalUser = user.toObject();
  const { role, resources, coins, email, username, firstName, lastName, referralCode, ban, profilePicture } = data;
  
  if (role) user.role = role;
  if (typeof coins === 'number') user.coins = coins;
  if (resources) user.resources = { ...(user.resources || {}), ...resources };
  
  const oldEmail = user.email;
  const oldUsername = user.username;
  const emailChanged = email && email !== oldEmail;
  const usernameChanged = username && username !== oldUsername;

  if (emailChanged) {
    const existing = await User.findOne({ email }).lean();
    if (existing) throw new AppError('Email already in use by another user.', 409, 'ERR_EMAIL_IN_USE');
  }
  
  if (usernameChanged) {
    const existing = await User.findOne({ username }).lean();
    if (existing) throw new AppError('Username already in use by another user.', 409, 'ERR_USERNAME_IN_USE');
  }

  if (emailChanged || usernameChanged) {
    const checkEmail = email || oldEmail;
    const checkUsername = username || oldUsername;
    const pterodactylCheck = await checkUserExists(checkEmail, checkUsername, user.pterodactylUserId);
    if (pterodactylCheck.emailExists) throw new AppError('Email already exists in Pterodactyl panel.', 409, 'ERR_PTERO_EMAIL_EXISTS');
    if (pterodactylCheck.usernameExists) throw new AppError('Username already exists in Pterodactyl panel.', 409, 'ERR_PTERO_USERNAME_EXISTS');
  }

  if (emailChanged) user.email = email;
  if (usernameChanged) user.username = username;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (profilePicture !== undefined) user.profilePicture = profilePicture;
  
  if (typeof referralCode === 'string') {
    const desired = referralCode.trim().toUpperCase();
    const exists = await User.findOne({ referralCode: desired }).lean();
    if (exists && String(exists._id) !== String(user._id)) {
      throw new AppError('Referral code is already in use by another user.', 409, 'ERR_REFERRAL_CODE_IN_USE');
    }
    user.referralCode = desired;
  }
  
  if (ban && typeof ban === 'object') {
    if (!user.ban) user.ban = {};
    const untilDate = ban.until === null ? null : (ban.until ? new Date(ban.until) : user.ban.until || null);
    user.ban.isBanned = typeof ban.isBanned === 'boolean' ? ban.isBanned : Boolean(user.ban.isBanned);
    if (typeof ban.reason === 'string') user.ban.reason = ban.reason;
    user.ban.until = untilDate;
    user.ban.by = req.user?.sub || req.user?.userId || user.ban.by || null;
  }
  await user.save();

  if (user.pterodactylUserId) {
    const payload = {
      email: user.email,
      username: user.username,
      first_name: user.firstName,
      last_name: user.lastName
    };
    try {
      await updatePanelUser(user.pterodactylUserId, payload);
    } catch {
      try {
        await PendingUpdate.create({ pterodactylUserId: user.pterodactylUserId, payload: JSON.stringify(payload) });
      } catch (queueErr) {
        console.error('Failed to queue admin Pterodactyl update:', queueErr.message);
      }
    }
  }

  try {
    const templateKey = user.ban?.isBanned ? 'accountBanned' : 'loginAlert';
    if (user.email && templateKey === 'accountBanned') {
      await sendMailTemplate({
        to: user.email,
        templateKey,
        data: { 
          username: user.username,
          reason: user.ban?.reason || '', 
          until: user.ban?.until ? new Date(user.ban.until).toISOString() : 'lifetime' 
        }
      });
    }
  } catch (_) {}
  
  const changes = {};
  if (role && role !== originalUser.role) changes.role = { old: originalUser.role, new: role };
  if (typeof coins === 'number' && coins !== originalUser.coins) changes.coins = { old: originalUser.coins, new: coins };
  if (emailChanged) changes.email = { old: originalUser.email, new: email };
  if (usernameChanged) changes.username = { old: originalUser.username, new: username };
  if (firstName && firstName !== originalUser.firstName) changes.firstName = { old: originalUser.firstName, new: firstName };
  if (lastName && lastName !== originalUser.lastName) changes.lastName = { old: originalUser.lastName, new: lastName };
  if (profilePicture !== undefined && profilePicture !== originalUser.profilePicture) changes.profilePicture = { old: originalUser.profilePicture, new: profilePicture };
  if (typeof referralCode === 'string' && user.referralCode !== originalUser.referralCode) changes.referralCode = { old: originalUser.referralCode, new: user.referralCode };
  
  if (resources) {
    for (const [k, v] of Object.entries(resources)) {
      const oldVal = (originalUser.resources || {})[k] || 0;
      if (v !== oldVal) changes[k] = { old: oldVal, new: v };
    }
  }
  
  if (ban) {
    if (ban.isBanned !== undefined && ban.isBanned !== (originalUser.ban?.isBanned || false)) changes['ban.isBanned'] = { old: originalUser.ban?.isBanned || false, new: ban.isBanned };
    if (ban.reason !== undefined && ban.reason !== (originalUser.ban?.reason || '')) changes['ban.reason'] = { old: originalUser.ban?.reason || '', new: ban.reason };
    if (ban.until !== undefined) {
      const oldTime = originalUser.ban?.until ? new Date(originalUser.ban.until).getTime() : null;
      const newTime = user.ban?.until ? new Date(user.ban.until).getTime() : null;
      if (oldTime !== newTime) changes['ban.until'] = { old: originalUser.ban?.until || null, new: user.ban?.until };
    }
  }

  await writeAudit(req, 'admin.user.update', 'user', user._id.toString(), { changes });

  if (Object.keys(changes).length > 0) {
    await logUserActivity(null, 'admin.user.update', { changes, updatedByAdmin: true }, user._id.toString());
  }

  await deleteCachePattern('admin:users');

  return { user };
};

const banUser = async (req, id, { isBanned, reason, durationMinutes }) => {
  const user = await User.findById(String(id));
  if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');

  if (!user.ban) user.ban = {};
  user.ban.isBanned = Boolean(isBanned);
  user.ban.reason = reason || '';
  if (isBanned) {
    if (durationMinutes == null) {
      user.ban.until = null;
    } else {
      const until = new Date();
      until.setMinutes(until.getMinutes() + Number(durationMinutes || 0));
      user.ban.until = until;
    }
    user.ban.by = req.user?.sub || req.user?.userId || null;
    try {
      const servers = await Server.find({ owner: user._id, panelServerId: { $exists: true, $ne: null } }).lean();
      for (const s of servers) {
        if (!s.panelServerId) continue;
        try { await suspendServer(s.panelServerId); } catch (_) {}
      }
    } catch (_) {}
  } else {
    user.ban.isBanned = false;
    user.ban.until = null;
    user.ban.by = req.user?.sub || req.user?.userId || null;
    try {
      const servers = await Server.find({ owner: user._id, panelServerId: { $exists: true, $ne: null } }).lean();
      for (const s of servers) {
        if (!s.panelServerId) continue;
        try { await unsuspendServer(s.panelServerId); } catch (_) {}
      }
    } catch (_) {}
  }
  await user.save();
  await writeAudit(req, isBanned ? 'admin.user.ban' : 'admin.user.unban', 'user', user._id.toString(), { reason: user.ban.reason, until: user.ban.until });
  await logUserActivity(null, isBanned ? 'admin.user.ban' : 'admin.user.unban', { reason: user.ban.reason, until: user.ban.until }, user._id.toString());
  await deleteCachePattern('admin:users');

  return { ok: true, ban: user.ban };
};

const deleteUser = async (req, id) => {
  if (String(id) === String(req.user?.sub || req.user?.userId)) {
    throw new AppError('Cannot delete your own admin account', 403, 'ERR_ADMIN_SELF_DELETE');
  }
  const user = await User.findById(String(id));
  if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  
  const servers = await Server.find({ owner: user._id });
  let deletedServers = 0;
  let serverErrors = [];
  
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
  
  let pterodactylError = null;
  if (user.pterodactylUserId) {
    try {
      await deletePanelUser(user.pterodactylUserId);
    } catch (error) {
      pterodactylError = error.message;
      console.error(`Failed to delete Pterodactyl user ${user.pterodactylUserId}:`, error.message);
    }
  }
  
  await User.deleteOne({ _id: user._id });
  
  await writeAudit(req, 'admin.user.delete', 'user', user._id.toString(), { 
    serversDeleted: deletedServers, 
    serverErrors: serverErrors.length,
    pterodactylError: !!pterodactylError 
  });
  
  await deleteCachePattern('admin:users');

  return { 
    ok: true, 
    serversDeleted: deletedServers,
    totalServers: servers.length,
    serverErrors,
    pterodactylError,
    message: serverErrors.length > 0 || pterodactylError 
      ? 'User deleted but some cleanup operations failed. Check server logs for details.'
      : 'User and all associated data deleted successfully.'
  };
};

const deleteServer = async (req, id, serverId) => {
  const server = await Server.findOne({ _id: String(serverId), owner: String(id) });
  if (!server) throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
  try { 
    await deletePanelServer(server.panelServerId); 
  } catch (e) {
    throw new AppError('Panel delete failed', 400, 'ERR_PANEL_DELETE_FAILED', { details: e?.response?.data || e.message });
  }
  await Server.deleteOne({ _id: server._id });
  await writeAudit(req, 'admin.user.server.delete', 'server', server._id.toString(), { owner: id });
  await deleteCachePattern('admin:users');
  return { ok: true };
};

const getServer = async (id, serverId) => {
  const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
  const server = await Server.findOne({ _id: String(serverId), owner: String(id) })
    .populate('eggId', 'name icon')
    .populate('locationId', 'name')
    .lean();
  if (!server) throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
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
      databases: Number(panelFeatures.databases) ?? server.limits?.allocations,
      allocations: Number(panelFeatures.allocations) ?? server.limits?.allocations,
    };
    const hasChange = ['diskMb','memoryMb','cpuPercent','backups','databases','allocations'].some(k => Number(server.limits?.[k] || 0) !== Number(updatedLimits[k] || 0));
    if (hasChange) await Server.updateOne({ _id: server._id }, { $set: { limits: updatedLimits } });
    return { ...server, limits: updatedLimits, clientUrl };
  } catch (_) {
    return { ...server, clientUrl };
  }
};

const updateServer = async (req, id, serverId, data) => {
  const server = await Server.findOne({ _id: String(serverId), owner: String(id) });
  if (!server) throw new AppError('Server not found', 404, 'ERR_SERVER_NOT_FOUND');
  const user = await User.findById(String(id));
  if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');

  if (data.limits) {
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

    const newLimits = { ...server.limits, ...data.limits };
    const violations = {};
    if (newLimits.diskMb > remaining.diskMb) violations.diskMb = `Exceeds remaining disk (${remaining.diskMb} MB)`;
    if (newLimits.memoryMb > remaining.memoryMb) violations.memoryMb = `Exceeds remaining memory (${remaining.memoryMb} MB)`;
    if (newLimits.cpuPercent > remaining.cpuPercent) violations.cpuPercent = `Exceeds remaining CPU (${remaining.cpuPercent}%)`;
    if (newLimits.backups > remaining.backups) violations.backups = `Exceeds remaining backups (${remaining.backups})`;
    if (newLimits.databases > remaining.databases) violations.databases = `Exceeds remaining databases (${remaining.databases})`;
    if (newLimits.allocations > remaining.allocations) violations.allocations = `Exceeds remaining allocations (${remaining.allocations})`;
    
    if (Object.keys(violations).length > 0) {
      throw new AppError('Requested resources exceed limits', 400, 'ERR_RESOURCES_EXCEEDED', { violations, remaining, limits: userLimits });
    }

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
      throw new AppError('Panel update failed', 400, 'ERR_PANEL_UPDATE_FAILED', { details: e?.response?.data || e.message });
    }
  }

  if (typeof data.name === 'string' && data.name.trim()) {
    try {
      await updateServerDetails(server.panelServerId, { name: data.name.trim(), user: user.pterodactylUserId, external_id: user._id.toString() });
      server.name = data.name.trim();
    } catch (e) {
      throw new AppError('Panel rename failed', 400, 'ERR_PANEL_RENAME_FAILED', { details: e?.response?.data || e.message });
    }
  }

  await server.save();
  await writeAudit(req, 'admin.user.server.update', 'server', server._id.toString(), { owner: id, changed: data });
  return { server };
};

const addPlan = async (req, id, { planId, months }) => {
  const user = await User.findById(String(id));
  if (!user) throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  const plan = await Plan.findById(planId);
  if (!plan) throw new AppError('Plan not found', 404, 'ERR_PLAN_NOT_FOUND');

  const now = new Date();
  let expiresAt = null;
  if (!plan.billingOptions?.lifetime) {
    expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + Math.max(0, months));
  }
  
  const pc = plan.productContent || {};
  const rr = pc.recurrentResources || {};
  const flatResources = {
    cpuPercent: rr.cpuPercent || 0,
    memoryMb: rr.memoryMb || 0,
    diskMb: rr.diskMb || 0,
    swapMb: rr.swapMb !== undefined ? rr.swapMb : -1,
    blockIoProportion: rr.blockIoProportion || 0,
    cpuPinning: rr.cpuPinning || '',
    additionalAllocations: pc.additionalAllocations || 0,
    databases: pc.databases || 0,
    backups: pc.backups || 0,
    coins: pc.coins || 0,
    serverLimit: pc.serverLimit || 0
  };

  const sub = await UserPlan.create({ 
    userId: user._id, 
    planId: plan._id, 
    purchaseDate: now,
    expiresAt, 
    status: 'active',
    billingCycle: plan.billingOptions?.lifetime ? 'lifetime' : 'monthly',
    amount: plan.billingOptions?.lifetime ? plan.pricePerMonth : plan.pricePerMonth * months,
    resources: flatResources,
    isRenewable: plan.billingOptions?.renewable || false,
    isLifetime: plan.billingOptions?.lifetime || false
  });

  const incQuery = {
    coins: Number(pc.coins || 0),
    'resources.diskMb': Number(rr.diskMb || 0),
    'resources.memoryMb': Number(rr.memoryMb || 0),
    'resources.cpuPercent': Number(rr.cpuPercent || 0),
    'resources.backups': Number(pc.backups || 0),
    'resources.databases': Number(pc.databases || 0),
    'resources.allocations': Number(pc.additionalAllocations || 0),
    'resources.serverSlots': Number(pc.serverLimit || 0),
  };

  Object.keys(incQuery).forEach(k => {
    if (incQuery[k] === 0 || isNaN(incQuery[k])) delete incQuery[k];
  });

  if (Object.keys(incQuery).length > 0) {
    await User.findByIdAndUpdate(user._id, { $inc: incQuery });
  }

  await writeAudit(req, 'admin.user.plan.add', 'user_plan', sub._id.toString(), { plan: plan.name, months });
  await logUserActivity(null, 'admin.user.plan.add', { plan: plan.name, months, updatedByAdmin: true }, user._id.toString());
  await deleteCachePattern('admin:users');
  await deleteCachePattern(`user:${user._id}:plans`);

  const populatedSub = await UserPlan.findById(sub._id).populate('planId', 'name pricePerMonth pricePerYear').lean();
  return { plan: populatedSub };
};

const cancelPlans = async (req, id, planId) => {
  const subs = await UserPlan.find({ userId: String(id), planId: String(planId), status: 'active' });
  if (subs.length === 0) throw new AppError('Active plan not found', 404, 'ERR_PLAN_NOT_FOUND');
  
  for (const sub of subs) {
    sub.status = 'cancelled';
    await sub.save();
    
    if (sub.resources) {
      const decQuery = {
        coins: -Number(sub.resources.coins || 0),
        'resources.diskMb': -Number(sub.resources.diskMb || 0),
        'resources.memoryMb': -Number(sub.resources.memoryMb || 0),
        'resources.cpuPercent': -Number(sub.resources.cpuPercent || 0),
        'resources.backups': -Number(sub.resources.backups || 0),
        'resources.databases': -Number(sub.resources.databases || 0),
        'resources.allocations': -Number(sub.resources.additionalAllocations || 0),
        'resources.serverSlots': -Number(sub.resources.serverLimit || 0),
      };
      
      Object.keys(decQuery).forEach(k => {
        if (decQuery[k] === 0 || isNaN(decQuery[k])) delete decQuery[k];
      });

      if (Object.keys(decQuery).length > 0) {
        await User.findByIdAndUpdate(String(id), { $inc: decQuery });
      }
    }
  }
  
  await writeAudit(req, 'admin.user.plan.cancel', 'user_plan', planId, { userId: id, planId, instancesCancelled: subs.length });
  await logUserActivity(null, 'admin.user.plan.cancel', { planId, instancesCancelled: subs.length, updatedByAdmin: true }, id);
  await deleteCachePattern('admin:users');
  await deleteCachePattern(`user:${id}:plans`);

  return { ok: true, instancesCancelled: subs.length };
};

const cancelPlanInstance = async (req, id, instanceId) => {
  const sub = await UserPlan.findOne({ _id: String(instanceId), userId: String(id), status: 'active' });
  if (!sub) throw new AppError('Active plan instance not found', 404, 'ERR_PLAN_INSTANCE_NOT_FOUND');
  
  sub.status = 'cancelled';
  await sub.save();
  
  if (sub.resources) {
    const decQuery = {
      coins: -Number(sub.resources.coins || 0),
      'resources.diskMb': -Number(sub.resources.diskMb || 0),
      'resources.memoryMb': -Number(sub.resources.memoryMb || 0),
      'resources.cpuPercent': -Number(sub.resources.cpuPercent || 0),
      'resources.backups': -Number(sub.resources.backups || 0),
      'resources.databases': -Number(sub.resources.databases || 0),
      'resources.allocations': -Number(sub.resources.additionalAllocations || 0),
      'resources.serverSlots': -Number(sub.resources.serverLimit || 0),
    };
    
    Object.keys(decQuery).forEach(k => {
      if (decQuery[k] === 0 || isNaN(decQuery[k])) delete decQuery[k];
    });

    if (Object.keys(decQuery).length > 0) {
      await User.findByIdAndUpdate(String(id), { $inc: decQuery });
    }
  }
  
  await writeAudit(req, 'admin.user.plan.instance.cancel', 'user_plan', sub._id.toString(), { userId: id, planId: sub.planId });
  await logUserActivity(null, 'admin.user.plan.instance.cancel', { planId: sub.planId, instanceId: sub._id.toString(), updatedByAdmin: true }, id);
  await deleteCachePattern('admin:users');
  await deleteCachePattern(`user:${id}:plans`);

  return { ok: true };
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
