const { writeAudit } = require('../middleware/audit');

const RECONCILE_META = {
  source: 'pterodactyl_panel',
  category: 'system_event',
};

async function logOwnerTransfer({ serverDoc, oldOwner, newOwner }) {
  const oldUsername = oldOwner.username || oldOwner.publicId;
  const newUsername = newOwner.username || newOwner.publicId;
  await writeAudit('system', 'server.transfer', 'server', serverDoc.publicId, {
    ...RECONCILE_META,
    serverName: serverDoc.name,
    panelServerId: serverDoc.panelServerId,
    targetUserId: newOwner.publicId,
    oldOwner: {
      id: oldOwner.publicId,
      username: oldOwner.username,
      email: oldOwner.email,
    },
    newOwner: {
      id: newOwner.publicId,
      username: newOwner.username,
      email: newOwner.email,
    },
    changes: {
      owner: `${oldUsername} -> ${newUsername}`,
    },
  });
}

async function logEggSync({ serverDoc, oldEgg, newEgg, panelEggId }) {
  const oldName = oldEgg.name || `Egg ${oldEgg.pterodactylEggId}`;
  const newName = newEgg.name || `Egg ${panelEggId}`;
  const ownerPubId = serverDoc.owner?.publicId || null;
  await writeAudit('system', 'server.sync_egg', 'server', serverDoc.publicId, {
    ...RECONCILE_META,
    serverName: serverDoc.name,
    panelServerId: serverDoc.panelServerId,
    targetUserId: ownerPubId,
    oldEgg: {
      id: oldEgg.publicId,
      name: oldEgg.name,
      pterodactylEggId: oldEgg.pterodactylEggId,
    },
    newEgg: {
      id: newEgg.publicId,
      name: newEgg.name,
      pterodactylEggId: panelEggId,
    },
    changes: {
      egg: `${oldName} -> ${newName}`,
    },
  });
}

async function logLocationSync({ serverDoc, oldLoc, newLoc }) {
  const oldName = oldLoc.name;
  const newName = newLoc.name;
  const ownerPubId = serverDoc.owner?.publicId || null;
  await writeAudit('system', 'server.sync_location', 'server', serverDoc.publicId, {
    ...RECONCILE_META,
    serverName: serverDoc.name,
    panelServerId: serverDoc.panelServerId,
    targetUserId: ownerPubId,
    oldLocation: {
      id: oldLoc.publicId,
      name: oldLoc.name,
    },
    newLocation: {
      id: newLoc.publicId,
      name: newLoc.name,
    },
    changes: {
      location: `${oldName} -> ${newName}`,
    },
  });
}

async function logNameSync({ serverDoc, oldName, newName }) {
  const ownerPubId = serverDoc.owner?.publicId || null;
  await writeAudit('system', 'server.sync_name', 'server', serverDoc.publicId, {
    ...RECONCILE_META,
    serverName: newName,
    panelServerId: serverDoc.panelServerId,
    targetUserId: ownerPubId,
    oldName,
    newName,
    changes: {
      name: `${oldName} -> ${newName}`,
    },
  });
}

async function logLimitsSync({ serverDoc, oldLimits, newLimits }) {
  const ownerPubId = serverDoc.owner?.publicId || null;
  await writeAudit('system', 'server.sync_limits', 'server', serverDoc.publicId, {
    ...RECONCILE_META,
    serverName: serverDoc.name,
    panelServerId: serverDoc.panelServerId,
    targetUserId: ownerPubId,
    oldLimits,
    newLimits,
    changes: {
      memory: `${oldLimits.memoryMb}MB -> ${newLimits.memoryMb}MB`,
      cpu: `${oldLimits.cpuPercent}% -> ${newLimits.cpuPercent}%`,
      disk: `${oldLimits.diskMb}MB -> ${newLimits.diskMb}MB`,
    },
  });
}

async function logSuspensionSync({ serverDoc, isPanelSuspended }) {
  const action = isPanelSuspended ? 'server.suspend' : 'server.unsuspend';
  const ownerPubId = serverDoc.owner?.publicId || null;
  await writeAudit('system', action, 'server', serverDoc.publicId, {
    ...RECONCILE_META,
    serverName: serverDoc.name,
    panelServerId: serverDoc.panelServerId,
    targetUserId: ownerPubId,
    status: isPanelSuspended ? 'suspended' : 'active',
    suspended: isPanelSuspended,
    changes: {
      status: isPanelSuspended ? 'Suspended in Pterodactyl panel' : 'Unsuspended in Pterodactyl panel',
    },
  });
}

async function logPanelDeletion({ serverDoc }) {
  const ownerPubId = serverDoc.owner?.publicId || null;
  await writeAudit('system', 'server.delete', 'server', serverDoc.publicId, {
    ...RECONCILE_META,
    serverName: serverDoc.name,
    panelServerId: serverDoc.panelServerId,
    targetUserId: ownerPubId,
    changes: {
      server: `${serverDoc.name} deleted directly in Pterodactyl panel`,
    },
  });
}

module.exports = {
  logOwnerTransfer,
  logEggSync,
  logLocationSync,
  logNameSync,
  logLimitsSync,
  logSuspensionSync,
  logPanelDeletion,
};
