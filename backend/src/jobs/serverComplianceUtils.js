'use strict';

const User = require('../models/User');
const UserPlan = require('../models/UserPlan');
const Server = require('../models/Server');
const { suspendServer } = require('../services/pterodactyl');

/**
 * Build the total resource pool for a user:
 *   base resources (User.resources) + resources granted by every active UserPlan.
 */
async function buildUserResourcePool(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const base = user.resources || {};
  const pool = {
    diskMb:      Number(base.diskMb      || 0),
    memoryMb:    Number(base.memoryMb    || 0),
    cpuPercent:  Number(base.cpuPercent  || 100),
    backups:     Number(base.backups     || 0),
    databases:   Number(base.databases   || 0),
    allocations: Number(base.allocations || 0),
    serverSlots: Number(base.serverSlots || 0),
  };

  const activePlans = await UserPlan.find({ userId, status: 'active' }).lean();
  for (const up of activePlans) {
    const r = up.resources || {};
    pool.diskMb      += Number(r.diskMb               || 0);
    pool.memoryMb    += Number(r.memoryMb             || 0);
    pool.cpuPercent  += Number(r.cpuPercent           || 0);
    pool.backups     += Number(r.backups              || 0);
    pool.databases   += Number(r.databases            || 0);
    pool.allocations += Number(r.additionalAllocations|| 0);
    pool.serverSlots += Number(r.serverLimit          || 0);
  }

  return { user, pool, activePlans };
}

/**
 * Suspend a panel server and mark it in our DB.
 * Silently swallows panel errors so one bad server does not abort the whole sweep.
 */
async function doSuspend(server, reason) {
  try {
    if (server.panelServerId) {
      await suspendServer(server.panelServerId);
    }
    await Server.findByIdAndUpdate(server._id, { status: 'suspended', suspended: true });
    console.log(`[Compliance] Suspended server ${server._id} (panel: ${server.panelServerId}) — reason: ${reason}`);
  } catch (err) {
    console.error(`[Compliance] Failed to suspend server ${server._id}:`, err.message);
  }
}

module.exports = {
  buildUserResourcePool,
  doSuspend,
};
