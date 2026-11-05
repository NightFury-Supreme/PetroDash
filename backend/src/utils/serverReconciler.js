const Server = require('../models/Server');
const User = require('../models/User');
const Egg = require('../models/Egg');
const Location = require('../models/Location');
const { invalidateServerCaches } = require('./serverCacheInvalidation');
const { deleteCache, publishEvent } = require('../lib/redis');
const { hasServerLimitsChanged } = require('./security');
const {
  logOwnerTransfer,
  logEggSync,
  logLocationSync,
  logNameSync,
  logLimitsSync,
  logSuspensionSync,
  logPanelDeletion,
} = require('./serverReconcileAuditor');

async function reconcileServerWithPanel(serverDoc, panelAttrs) {
  if (!serverDoc?._id || !panelAttrs) return serverDoc;

  const updates = {};
  let limitsChanged = false;
  let ownerChanged = false;

  const panelUserId = panelAttrs.user;
  const currentOwner = serverDoc.owner;

  if (panelUserId && currentOwner?.pterodactylUserId !== panelUserId) {
    const newUser = await User.findOne({ pterodactylUserId: panelUserId })
      .select('_id publicId username email pterodactylUserId')
      .lean();

    if (newUser && String(newUser._id) !== String(currentOwner?._id)) {
      updates.owner = newUser._id;
      const oldOwner = { ...currentOwner };
      serverDoc.owner = newUser;
      ownerChanged = true;

      if (oldOwner?.publicId) {
        await invalidateServerCaches({ userId: oldOwner.publicId, publicServerId: serverDoc.publicId });
        await deleteCache(`server:usage:${oldOwner.publicId}`);
        await publishEvent(`user:${oldOwner.publicId}:servers`, { type: 'SERVER_DELETED', serverId: serverDoc.publicId });
      }

      await invalidateServerCaches({ userId: newUser.publicId, publicServerId: serverDoc.publicId });
      await deleteCache(`server:usage:${newUser.publicId}`);
      await publishEvent(`user:${newUser.publicId}:servers`, { type: 'SERVER_CREATED', serverId: serverDoc.publicId });

      await logOwnerTransfer({ serverDoc, oldOwner, newOwner: newUser });
    }
  }

  const panelEggId = panelAttrs.egg;
  const currentEgg = serverDoc.eggId;

  if (panelEggId && currentEgg?.pterodactylEggId !== panelEggId) {
    const newEgg = await Egg.findOne({ pterodactylEggId: panelEggId })
      .select('_id publicId name icon pterodactylEggId')
      .lean();

    if (newEgg && String(newEgg._id) !== String(currentEgg?._id)) {
      updates.eggId = newEgg._id;
      const oldEgg = { ...currentEgg };
      serverDoc.eggId = newEgg;
      await logEggSync({ serverDoc, oldEgg, newEgg, panelEggId });
    }
  }

  const panelLocId = panelAttrs.relationships?.location?.attributes?.id || panelAttrs.relationships?.node?.attributes?.location_id;
  const currentLoc = serverDoc.locationId;

  if (panelLocId && String(currentLoc?.platform?.platformLocationId) !== String(panelLocId)) {
    const newLoc = await Location.findOne({ 'platform.platformLocationId': String(panelLocId) })
      .select('_id publicId name flag platform')
      .lean();

    if (newLoc && String(newLoc._id) !== String(currentLoc?._id)) {
      updates.locationId = newLoc._id;
      const oldLoc = { ...currentLoc };
      serverDoc.locationId = newLoc;
      await logLocationSync({ serverDoc, oldLoc, newLoc });
    }
  }

  if (panelAttrs.name && serverDoc.name !== panelAttrs.name) {
    const oldName = serverDoc.name;
    updates.name = panelAttrs.name;
    serverDoc.name = panelAttrs.name;
    await logNameSync({ serverDoc, oldName, newName: panelAttrs.name });
  }

  if (panelAttrs.identifier && serverDoc.identifier !== panelAttrs.identifier) {
    updates.identifier = panelAttrs.identifier;
    serverDoc.identifier = panelAttrs.identifier;
  }

  const panelLimits = panelAttrs.limits || {};
  const panelFeatures = panelAttrs.feature_limits || {};
  const currentLimits = serverDoc.limits || {};

  const updatedLimits = {
    diskMb: Number(panelLimits.disk ?? currentLimits.diskMb),
    memoryMb: Number(panelLimits.memory ?? currentLimits.memoryMb),
    cpuPercent: Number(panelLimits.cpu ?? currentLimits.cpuPercent),
    backups: Number(panelFeatures.backups ?? currentLimits.backups),
    databases: Number(panelFeatures.databases ?? currentLimits.databases),
    allocations: Number(panelFeatures.allocations ?? currentLimits.allocations),
  };

  if (hasServerLimitsChanged(currentLimits, updatedLimits)) {
    updates.limits = updatedLimits;
    const oldLimits = { ...currentLimits };
    serverDoc.limits = updatedLimits;
    limitsChanged = true;
    await logLimitsSync({ serverDoc, oldLimits, newLimits: updatedLimits });
  }

  const isPanelSuspended = Boolean(panelAttrs.suspended === true || panelAttrs.suspended === 1);
  if (isPanelSuspended) {
    if (serverDoc.status !== 'suspended' || !serverDoc.suspended) {
      updates.status = 'suspended';
      updates.suspended = true;
      serverDoc.status = 'suspended';
      serverDoc.suspended = true;
      await logSuspensionSync({ serverDoc, isPanelSuspended: true });
    }
  } else {
    if (serverDoc.status === 'suspended' || serverDoc.suspended) {
      updates.status = 'active';
      updates.suspended = false;
      updates.suspendedUntil = null;
      updates.suspensionReason = null;
      serverDoc.status = 'active';
      serverDoc.suspended = false;
      serverDoc.suspendedUntil = null;
      serverDoc.suspensionReason = null;
      await logSuspensionSync({ serverDoc, isPanelSuspended: false });
    } else {
      const isInstalling = panelAttrs.status === 'installing' || panelAttrs?.container?.installed === false || panelAttrs?.container?.installed === 0;
      if (isInstalling && serverDoc.status !== 'creating') {
        updates.status = 'creating';
        serverDoc.status = 'creating';
      } else if (!isInstalling && serverDoc.status === 'creating') {
        updates.status = 'active';
        serverDoc.status = 'active';
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    await Server.updateOne({ _id: serverDoc._id }, { $set: updates });
    const ownerPubId = serverDoc.owner?.publicId;

    if (ownerPubId) {
      await invalidateServerCaches({ userId: ownerPubId, publicServerId: serverDoc.publicId });
      if (limitsChanged) {
        await deleteCache(`server:usage:${ownerPubId}`);
      }
      if (!ownerChanged) {
        await publishEvent(`user:${ownerPubId}:servers`, { type: 'SERVER_UPDATED', serverId: serverDoc.publicId });
      }
    }
  }

  return serverDoc;
}

async function handlePanelServerDeleted(serverDoc) {
  if (!serverDoc?._id) return;
  await Server.deleteOne({ _id: serverDoc._id });
  const ownerPubId = serverDoc.owner?.publicId;
  await invalidateServerCaches({
    userId: ownerPubId,
    publicServerId: serverDoc.publicId,
    eggId: serverDoc.eggId?.publicId || (serverDoc.eggId ? String(serverDoc.eggId) : null),
    locationId: serverDoc.locationId?.publicId || (serverDoc.locationId ? String(serverDoc.locationId) : null),
  });
  if (ownerPubId) {
    await deleteCache(`server:usage:${ownerPubId}`);
    await publishEvent(`user:${ownerPubId}:servers`, { type: 'SERVER_DELETED', serverId: serverDoc.publicId });
  }
  await logPanelDeletion({ serverDoc });
}

async function reconcileAllServersWithPanel() {
  const { getAllServers } = require('../services/pterodactyl');
  let panelServers;
  try {
    panelServers = await getAllServers();
  } catch (err) {
    process.stderr.write(`[Reconciler] Failed to fetch panel servers: ${err.message}\n`);
    return;
  }

  const panelServerMap = new Map();
  for (const s of panelServers) {
    if (s?.attributes?.id) {
      panelServerMap.set(s.attributes.id, s.attributes);
    }
  }

  const dbServers = await Server.find({
    panelServerId: { $exists: true, $ne: null },
    status: { $ne: 'queued' },
  })
    .populate('owner', 'publicId pterodactylUserId username email')
    .populate('eggId', 'publicId pterodactylEggId name icon')
    .populate('locationId', 'publicId platform name flag')
    .lean();

  const BATCH_SIZE = 25;
  for (let i = 0; i < dbServers.length; i += BATCH_SIZE) {
    const chunk = dbServers.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map((dbServer) => {
        const panelAttrs = panelServerMap.get(dbServer.panelServerId);
        if (!panelAttrs) {
          return handlePanelServerDeleted(dbServer);
        }
        return reconcileServerWithPanel(dbServer, panelAttrs);
      })
    );
  }
}

module.exports = {
  reconcileServerWithPanel,
  handlePanelServerDeleted,
  reconcileAllServersWithPanel,
};
