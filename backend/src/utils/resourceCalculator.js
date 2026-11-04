const UserPlan = require('../models/UserPlan');
require('../models/Plan');

async function calculateUserTotalResources(user, options = {}) {
  const base = user?.resources || {};
  const totalResources = {
    diskMb: Number(base.diskMb || 0),
    memoryMb: Number(base.memoryMb || 0),
    cpuPercent: Number(base.cpuPercent || 0),
    backups: Number(base.backups || 0),
    databases: Number(base.databases || 0),
    allocations: Number(base.allocations || 0),
    serverSlots: Number(base.serverSlots ?? 1),
  };

  const now = new Date();
  const query = UserPlan.find({
    userId: user._id,
    status: 'active',
    $or: [
      { isLifetime: true },
      { expiresAt: null },
      { expiresAt: { $gt: now } }
    ]
  })
    .select('resources planId')
    .populate('planId', 'name publicId')
    .lean();

  if (options.session) {
    query.session(options.session);
  }

  const activePlans = await query;
  for (const up of activePlans) {
    const r = up.resources || {};
    totalResources.diskMb += Number(r.diskMb || 0);
    totalResources.memoryMb += Number(r.memoryMb || 0);
    totalResources.cpuPercent += Number(r.cpuPercent || 0);
    totalResources.backups += Number(r.backups || 0);
    totalResources.databases += Number(r.databases || 0);
    totalResources.allocations += Number(r.additionalAllocations || 0);
    totalResources.serverSlots += Number(r.serverLimit || 0);
  }

  return { totalResources, activePlans };
}

module.exports = { calculateUserTotalResources };
