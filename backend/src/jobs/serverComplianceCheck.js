'use strict';

const User = require('../models/User');
const Server = require('../models/Server');
const Location = require('../models/Location');
const Egg = require('../models/Egg');
const { buildUserResourcePool, doSuspend, doUnsuspend } = require('./serverComplianceUtils');
const { writeAudit } = require('../middleware/audit');

async function runComplianceSweep() {
  try {
    process.stdout.write('[Compliance] Starting server compliance sweep...\n');

    const activeServers = await Server.find({
      status: 'active',
      panelServerId: { $exists: true, $ne: null },
    })
      .populate('owner', 'publicId pterodactylUserId')
      .lean();

    if (activeServers.length === 0) {
      process.stdout.write('[Compliance] No active servers to check.\n');
      return;
    }

    const byOwner = {};
    for (const s of activeServers) {
      const ownerId = s.owner?.publicId;
      if (!ownerId) continue;
      if (!byOwner[ownerId]) byOwner[ownerId] = [];
      byOwner[ownerId].push(s);
    }

    const locationIds = [...new Set(activeServers.map(s => s.locationId).filter(Boolean))];
    const eggIds = [...new Set(activeServers.map(s => s.eggId).filter(Boolean))];

    const locationMap = {};
    const eggMap = {};

    const [locations, eggs] = await Promise.all([
      Location.find({ _id: { $in: locationIds } }).lean(),
      Egg.find({ _id: { $in: eggIds } }).lean(),
    ]);
    for (const l of locations) locationMap[String(l._id)] = l;
    for (const e of eggs) eggMap[String(e._id)] = e;

    let totalSuspended = 0;

    for (const [ownerId, servers] of Object.entries(byOwner)) {
      try {
        const result = await buildUserResourcePool(ownerId);
        if (!result) continue;

        const { user, pool, activePlans } = result;

        const planTokens = new Set();
        for (const p of activePlans) {
          if (!p || !p.planId) continue;
          if (typeof p.planId === 'object') {
            if (p.planId.publicId) planTokens.add(String(p.planId.publicId));
            if (p.planId.name) planTokens.add(String(p.planId.name));
          }
        }

        const isBanActive = Boolean(user.ban?.isBanned) && (!user.ban.until || new Date(user.ban.until) > new Date());
        if (isBanActive) {
          for (const server of servers) {
            await doSuspend(server, 'account_banned');
            totalSuspended++;
          }
          continue;
        }

        if (user.ban?.isBanned && user.ban.until && new Date(user.ban.until) <= new Date()) {
          await User.updateOne(
            { _id: user._id },
            { $set: { 'ban.isBanned': false, 'ban.until': null, 'ban.reason': '' } }
          );
          const suspendedAccountServers = await Server.find({
            owner: user._id,
            status: 'suspended',
            suspensionReason: 'account_banned',
            panelServerId: { $exists: true, $ne: null },
          }).populate('owner', 'publicId pterodactylUserId');
          for (const server of suspendedAccountServers) {
            await doUnsuspend(server);
          }
        }

        if (pool.serverSlots > 0 && servers.length > pool.serverSlots) {
          const sorted = [...servers].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          const toSuspend = sorted.slice(pool.serverSlots);
          for (const server of toSuspend) {
            await doSuspend(server, `server_slot_exceeded (limit: ${pool.serverSlots}, count: ${servers.length})`, {
              limit: pool.serverSlots,
              count: servers.length,
            });
            totalSuspended++;
          }
        }

        let usedDisk = 0, usedMem = 0, usedCpu = 0, usedBackups = 0, usedDbs = 0, usedAlloc = 0;
        for (const s of servers) {
          const l = s.limits || {};
          usedDisk += Number(l.diskMb || 0);
          usedMem += Number(l.memoryMb || 0);
          usedCpu += Number(l.cpuPercent || 0);
          usedBackups += Number(l.backups || 0);
          usedDbs += Number(l.databases || 0);
          usedAlloc += Number(l.allocations || 0);
        }

        const overDisk = usedDisk > pool.diskMb;
        const overMem = usedMem > pool.memoryMb;
        const overCpu = usedCpu > pool.cpuPercent;
        const overBackups = usedBackups > pool.backups;
        const overDbs = usedDbs > pool.databases;
        const overAlloc = usedAlloc > pool.allocations;

        if (overDisk || overMem || overCpu || overBackups || overDbs || overAlloc) {
          const sorted = [...servers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          let runDisk = usedDisk, runMem = usedMem, runCpu = usedCpu;
          let runBackups = usedBackups, runDbs = usedDbs, runAlloc = usedAlloc;

          for (const server of sorted) {
            const still =
              runDisk > pool.diskMb ||
              runMem > pool.memoryMb ||
              runCpu > pool.cpuPercent ||
              runBackups > pool.backups ||
              runDbs > pool.databases ||
              runAlloc > pool.allocations;

            if (!still) break;

            const l = server.limits || {};
            runDisk -= Number(l.diskMb || 0);
            runMem -= Number(l.memoryMb || 0);
            runCpu -= Number(l.cpuPercent || 0);
            runBackups -= Number(l.backups || 0);
            runDbs -= Number(l.databases || 0);
            runAlloc -= Number(l.allocations || 0);

            await doSuspend(server, 'resource_overallocation', {
              overDisk,
              overMem,
              overCpu,
              overBackups,
              overDbs,
              overAlloc,
            });
            totalSuspended++;
          }
        }

        const stillActive = servers.filter(() => true);

        for (const server of stillActive) {
          const location = locationMap[String(server.locationId)];
          if (!location) continue;

          const restricted = Array.isArray(location.allowedPlans) && location.allowedPlans.length > 0;
          if (!restricted) continue;

          const allowed = location.allowedPlans.some(ap => planTokens.has(String(ap)));
          if (!allowed) {
            const locName = location.name || location.shortCode || String(server.locationId);
            await doSuspend(server, `unauthorized_location (${locName})`, { locationName: locName, locationId: server.locationId });
            totalSuspended++;
          }
        }

        for (const server of stillActive) {
          const egg = eggMap[String(server.eggId)];
          if (!egg) continue;

          const restricted = Array.isArray(egg.allowedPlans) && egg.allowedPlans.length > 0;
          if (!restricted) continue;

          const allowed = egg.allowedPlans.some(ap => planTokens.has(String(ap)));
          if (!allowed) {
            const eggName = egg.name || String(server.eggId);
            await doSuspend(server, `unauthorized_egg (${eggName})`, { eggName, eggId: server.eggId });
            totalSuspended++;
          }
        }

      } catch (err) {
        await writeAudit('system', 'system.compliance.owner_error', 'user', ownerId, { error: err.message, category: 'system_event' }).catch(() => {});
      }
    }

    process.stdout.write(`[Compliance] Sweep complete. Suspended ${totalSuspended} server(s).\n`);
  } catch (error) {
    const { writeAudit: logAudit } = require('../middleware/audit');
    await logAudit('system', 'system.compliance.sweep_failed', 'compliance', 'compliance', { error: error.message, category: 'system_event' }).catch(() => {});
  }
}

let complianceInterval = null;
const INTERVAL_MS = 30 * 60 * 1000;

function startComplianceJob() {
  if (complianceInterval) return;
  setTimeout(runComplianceSweep, 20000);
  complianceInterval = setInterval(runComplianceSweep, INTERVAL_MS);
  process.stdout.write('[Job] Started server compliance job (runs every 30 minutes)\n');
}

function stopComplianceJob() {
  if (complianceInterval) {
    clearInterval(complianceInterval);
    complianceInterval = null;
  }
}

module.exports = { runComplianceSweep, startComplianceJob, stopComplianceJob };
