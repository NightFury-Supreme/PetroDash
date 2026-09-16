/**
 * Job: Server Compliance Checker
 *
 * Runs every 30 minutes. Scans all active servers and suspends any that violate:
 *  1. Resource overallocation  – server limits exceed the owning user's total available resources
 *  2. Server slot overuse      – user owns more active servers than their serverSlots limit
 *  3. Unauthorized location    – location requires a plan the user no longer holds
 *  4. Unauthorized egg type    – egg requires a plan the user no longer holds
 *  5. Banned users             – servers belonging to a banned account that are still running
 */

'use strict';

const mongoose = require('mongoose');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build the total resource pool for a user:
 *   base resources (User.resources) + resources granted by every active UserPlan.
 */
async function buildUserResourcePool(userId) {
  const User     = require('../models/User');
  const UserPlan = require('../models/UserPlan');

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
  const Server = require('../models/Server');
  const { suspendServer } = require('../services/pterodactyl');

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

// ─── Main sweep ─────────────────────────────────────────────────────────────

async function runComplianceSweep() {
  const Server   = require('../models/Server');
  const User     = require('../models/User');
  const Location = require('../models/Location');
  const Egg      = require('../models/Egg');
  const UserPlan = require('../models/UserPlan');
  const { writeAudit } = require('../middleware/audit');

  console.log('[Compliance] Starting server compliance sweep...');

  // Fetch all active servers that have a panel ID (only those that are actually running)
  const activeServers = await Server.find({
    status: 'active',
    panelServerId: { $exists: true, $ne: null },
  }).lean();

  if (activeServers.length === 0) {
    console.log('[Compliance] No active servers to check.');
    return;
  }

  // Group servers by owner for efficient per-user checks
  const byOwner = {};
  for (const s of activeServers) {
    const ownerId = String(s.owner);
    if (!byOwner[ownerId]) byOwner[ownerId] = [];
    byOwner[ownerId].push(s);
  }

  // Pre-fetch all referenced locations and eggs in bulk
  const locationIds = [...new Set(activeServers.map(s => String(s.locationId)).filter(Boolean))];
  const eggIds      = [...new Set(activeServers.map(s => String(s.eggId)).filter(Boolean))];

  const locationMap = {};
  const eggMap      = {};

  const [locations, eggs] = await Promise.all([
    Location.find({ _id: { $in: locationIds } }).lean(),
    Egg.find({ _id: { $in: eggIds } }).lean(),
  ]);
  for (const l of locations) locationMap[String(l._id)] = l;
  for (const e of eggs)      eggMap[String(e._id)]      = e;

  let totalSuspended = 0;

  // ── Per-user sweep ──────────────────────────────────────────────────────
  for (const [ownerId, servers] of Object.entries(byOwner)) {
    try {
      const result = await buildUserResourcePool(ownerId);
      if (!result) continue;

      const { user, pool, activePlans } = result;

      // Build a Set of active plan IDs and names for plan-access checks
      const activePlanIds   = new Set(activePlans.map(p => String(p.planId)));
      const activePlanNames = new Set();
      // Populate plan names (we need a second query only for name-based checks)
      const Plan = require('../models/Plan');
      const planDocs = await Plan.find({ _id: { $in: [...activePlanIds] } }).select('name').lean();
      for (const pd of planDocs) activePlanNames.add(pd.name);

      const planTokens = new Set([...activePlanIds, ...activePlanNames]);

      // ── CHECK 1: Banned users ─────────────────────────────────────────
      if (user.ban?.isBanned) {
        for (const server of servers) {
          await doSuspend(server, 'account_banned');
          totalSuspended++;
          await writeAudit(
            'system',
            'system.compliance.suspend',
            'server',
            server._id.toString(),
            { reason: 'account_banned', userId: ownerId }
          );
        }
        continue; // No further checks needed for banned user
      }

      // ── CHECK 2: Server slot overuse ──────────────────────────────────
      // Sort by creation date — oldest servers survive, newest get suspended
      if (pool.serverSlots > 0 && servers.length > pool.serverSlots) {
        const sorted     = [...servers].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const toSuspend  = sorted.slice(pool.serverSlots);
        for (const server of toSuspend) {
          await doSuspend(server, `server_slot_exceeded (limit: ${pool.serverSlots}, count: ${servers.length})`);
          totalSuspended++;
          await writeAudit(
            'system',
            'system.compliance.suspend',
            'server',
            server._id.toString(),
            { reason: 'server_slot_exceeded', limit: pool.serverSlots, count: servers.length, userId: ownerId }
          );
        }
      }

      // ── CHECK 3: Resource overallocation ─────────────────────────────
      // Tally up what the user's servers are currently consuming
      let usedDisk = 0, usedMem = 0, usedCpu = 0, usedBackups = 0, usedDbs = 0, usedAlloc = 0;
      for (const s of servers) {
        const l = s.limits || {};
        usedDisk    += Number(l.diskMb      || 0);
        usedMem     += Number(l.memoryMb    || 0);
        usedCpu     += Number(l.cpuPercent  || 0);
        usedBackups += Number(l.backups     || 0);
        usedDbs     += Number(l.databases   || 0);
        usedAlloc   += Number(l.allocations || 0);
      }

      const overDisk    = usedDisk    > pool.diskMb;
      const overMem     = usedMem     > pool.memoryMb;
      const overCpu     = usedCpu     > pool.cpuPercent;
      const overBackups = usedBackups > pool.backups;
      const overDbs     = usedDbs     > pool.databases;
      const overAlloc   = usedAlloc   > pool.allocations;

      if (overDisk || overMem || overCpu || overBackups || overDbs || overAlloc) {
        // Suspend servers from newest → oldest until we come back within limits
        const sorted = [...servers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        let runDisk = usedDisk, runMem = usedMem, runCpu = usedCpu;
        let runBackups = usedBackups, runDbs = usedDbs, runAlloc = usedAlloc;

        for (const server of sorted) {
          const still = 
            runDisk    > pool.diskMb    ||
            runMem     > pool.memoryMb  ||
            runCpu     > pool.cpuPercent||
            runBackups > pool.backups   ||
            runDbs     > pool.databases ||
            runAlloc   > pool.allocations;

          if (!still) break;

          const l = server.limits || {};
          runDisk    -= Number(l.diskMb      || 0);
          runMem     -= Number(l.memoryMb    || 0);
          runCpu     -= Number(l.cpuPercent  || 0);
          runBackups -= Number(l.backups     || 0);
          runDbs     -= Number(l.databases   || 0);
          runAlloc   -= Number(l.allocations || 0);

          await doSuspend(server, 'resource_overallocation');
          totalSuspended++;
          await writeAudit(
            'system',
            'system.compliance.suspend',
            'server',
            server._id.toString(),
            {
              reason: 'resource_overallocation',
              pool,
              serverLimits: server.limits,
              userId: ownerId,
            }
          );
        }
      }

      // Re-fetch remaining active servers (some may have just been suspended above)
      const stillActive = servers.filter(s => {
        // Skip servers we already suspended in resource check
        return true; // We check location/egg for all original servers; doSuspend is idempotent
      });

      // ── CHECK 4: Unauthorized location ───────────────────────────────
      for (const server of stillActive) {
        const location = locationMap[String(server.locationId)];
        if (!location) continue;

        const restricted = Array.isArray(location.allowedPlans) && location.allowedPlans.length > 0;
        if (!restricted) continue;

        const allowed = location.allowedPlans.some(ap => planTokens.has(String(ap)));
        if (!allowed) {
          await doSuspend(server, `unauthorized_location (locationId: ${server.locationId})`);
          totalSuspended++;
          await writeAudit(
            'system',
            'system.compliance.suspend',
            'server',
            server._id.toString(),
            { reason: 'unauthorized_location', locationId: server.locationId, userId: ownerId }
          );
        }
      }

      // ── CHECK 5: Unauthorized egg type ───────────────────────────────
      for (const server of stillActive) {
        const egg = eggMap[String(server.eggId)];
        if (!egg) continue;

        const restricted = Array.isArray(egg.allowedPlans) && egg.allowedPlans.length > 0;
        if (!restricted) continue;

        const allowed = egg.allowedPlans.some(ap => planTokens.has(ap));
        if (!allowed) {
          await doSuspend(server, `unauthorized_egg (eggId: ${server.eggId})`);
          totalSuspended++;
          await writeAudit(
            'system',
            'system.compliance.suspend',
            'server',
            server._id.toString(),
            { reason: 'unauthorized_egg', eggId: server.eggId, userId: ownerId }
          );
        }
      }

    } catch (err) {
      console.error(`[Compliance] Error processing owner ${ownerId}:`, err.message);
    }
  }

  console.log(`[Compliance] Sweep complete. Suspended ${totalSuspended} server(s).`);
}

// ─── Job lifecycle ───────────────────────────────────────────────────────────

let complianceInterval = null;

const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

function startComplianceJob() {
  if (complianceInterval) return;
  // Run once shortly after startup (give DB 20 s to fully connect)
  setTimeout(runComplianceSweep, 20000);
  complianceInterval = setInterval(runComplianceSweep, INTERVAL_MS);
  console.log('[Job] Started server compliance job (runs every 30 minutes)');
}

function stopComplianceJob() {
  if (complianceInterval) {
    clearInterval(complianceInterval);
    complianceInterval = null;
  }
}

module.exports = { runComplianceSweep, startComplianceJob, stopComplianceJob };
