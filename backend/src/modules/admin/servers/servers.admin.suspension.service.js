const Server = require('../../../models/Server');
const { acquireLock, releaseLock, publishEvent } = require('../../../lib/redis');
const { invalidateServerCaches } = require('../../../utils/serverCacheInvalidation');
const { suspendServer: panelSuspend, unsuspendServer: panelUnsuspend, updateServerDetails } = require('../../../services/pterodactyl');
const { writeAudit } = require('../../../middleware/audit');
const AppError = require('../../../utils/AppError');
const { formatPublicEntity } = require('../../../utils/publicId');

function calculateSuspensionExpiry(duration, customUntil, durationMinutes) {
  const now = Date.now();
  if (durationMinutes != null && Number(durationMinutes) > 0) {
    return new Date(now + Number(durationMinutes) * 60 * 1000);
  }
  switch (duration) {
    case '1h': return new Date(now + 1 * 60 * 60 * 1000);
    case '6h': return new Date(now + 6 * 60 * 60 * 1000);
    case '12h': return new Date(now + 12 * 60 * 60 * 1000);
    case '1d': return new Date(now + 24 * 60 * 60 * 1000);
    case '3d': return new Date(now + 3 * 24 * 60 * 60 * 1000);
    case '7d': return new Date(now + 7 * 24 * 60 * 60 * 1000);
    case '14d': return new Date(now + 14 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now + 30 * 24 * 60 * 60 * 1000);
    case 'custom': {
      if (!customUntil) {
        throw AppError.badRequest('Custom expiration date required', 'ERR_INVALID_EXPIRATION');
      }
      const d = new Date(customUntil);
      if (isNaN(d.getTime()) || d.getTime() <= now) {
        throw AppError.badRequest('Expiration date must be in the future', 'ERR_INVALID_EXPIRATION');
      }
      return d;
    }
    case 'lifetime':
    default:
      return null;
  }
}

function formatSuspensionDescription(reason, suspendedUntil) {
  const cleanReason = (reason || '').trim();
  if (suspendedUntil) {
    const timeStr = new Date(suspendedUntil).toUTCString();
    return cleanReason ? `${cleanReason}. till ${timeStr}` : `Suspended till ${timeStr}`;
  }
  return cleanReason ? `${cleanReason}. (Lifetime)` : 'Suspended permanently (Lifetime)';
}

const suspendServer = async (id, data, req = null) => {
  const lockToken = await acquireLock(`server:${id}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Server operation already in progress', 'ERR_SERVER_LOCKED');
  }

  try {
    const server = await Server.findOne({ publicId: id }).populate('owner', 'publicId pterodactylUserId username');
    if (!server) {
      throw AppError.notFound('Server not found', 'ERR_SERVER_NOT_FOUND');
    }

    if (server.status && server.status.toLowerCase() === 'creating') {
      throw AppError.forbidden('Cannot suspend server while it is being created', 'ERR_SERVER_CREATING');
    }

    if (server.status === 'suspended' || server.suspended === true) {
      throw AppError.badRequest('Server is already suspended', 'ERR_SERVER_ALREADY_SUSPENDED');
    }

    const duration = data.duration || 'lifetime';
    const suspendedUntil = calculateSuspensionExpiry(duration, data.customUntil, data.durationMinutes);
    const description = formatSuspensionDescription(data.reason, suspendedUntil);

    if (server.panelServerId) {
      const pteroUserId = server.owner?.pterodactylUserId;
      if (!pteroUserId) {
        throw AppError.badRequest('Owner is missing panel user account', 'ERR_PANEL_USER_NOT_FOUND');
      }
      await panelSuspend(server.panelServerId);
      await updateServerDetails(server.panelServerId, {
        name: server.name,
        user: pteroUserId,
        description,
      });
    }

    server.status = 'suspended';
    server.suspended = true;
    server.suspendedUntil = suspendedUntil;
    server.suspensionReason = (data.reason || '').trim() || null;
    await server.save();

    const publicServerId = server.publicId;
    const ownerPublicId = server.owner?.publicId;

    if (ownerPublicId) {
      await writeAudit(
        req?.user?.publicId || 'system',
        'server.suspend',
        'server',
        publicServerId,
        {
          serverId: publicServerId,
          serverName: server.name,
          targetUserId: ownerPublicId,
          reason: server.suspensionReason || 'No reason provided',
          duration,
          suspendedUntil,
          description,
          category: 'user_activity',
          actorRole: req?.user?.role || 'admin',
          actorUsername: req?.user?.username || 'Staff Operator',
          performedByStaff: Boolean(req?.user),
        }
      );

      await invalidateServerCaches({ userId: ownerPublicId, publicServerId });
      await publishEvent(`user:${ownerPublicId}:servers`, { type: 'SERVER_UPDATED', serverId: publicServerId });
    }

    await writeAudit(req, 'admin.server.suspend', 'server', publicServerId, {
      reason: server.suspensionReason,
      duration,
      suspendedUntil,
      description,
      targetUserId: ownerPublicId,
    });

    return { server: formatPublicEntity(server, 'server'), description };
  } finally {
    await releaseLock(`server:${id}`, lockToken);
  }
};

const unsuspendServer = async (id, req = null) => {
  const lockToken = await acquireLock(`server:${id}`, 5000);
  if (!lockToken) {
    throw AppError.conflict('Server operation already in progress', 'ERR_SERVER_LOCKED');
  }

  try {
    const server = await Server.findOne({ publicId: id }).populate('owner', 'publicId pterodactylUserId username');
    if (!server) {
      throw AppError.notFound('Server not found', 'ERR_SERVER_NOT_FOUND');
    }

    if (server.status !== 'suspended' && server.suspended !== true) {
      throw AppError.badRequest('Server is not currently suspended', 'ERR_SERVER_NOT_SUSPENDED');
    }

    if (server.panelServerId) {
      const pteroUserId = server.owner?.pterodactylUserId;
      if (!pteroUserId) {
        throw AppError.badRequest('Owner is missing panel user account', 'ERR_PANEL_USER_NOT_FOUND');
      }
      await panelUnsuspend(server.panelServerId);
      await updateServerDetails(server.panelServerId, {
        name: server.name,
        user: pteroUserId,
        description: '',
      });
    }

    server.status = 'active';
    server.suspended = false;
    server.suspendedUntil = null;
    server.suspensionReason = null;
    await server.save();

    const publicServerId = server.publicId;
    const ownerPublicId = server.owner?.publicId;

    if (ownerPublicId) {
      await writeAudit(
        req?.user?.publicId || 'system',
        'server.unsuspend',
        'server',
        publicServerId,
        {
          serverId: publicServerId,
          serverName: server.name,
          targetUserId: ownerPublicId,
          category: 'user_activity',
          actorRole: req?.user?.role || 'admin',
          actorUsername: req?.user?.username || 'Staff Operator',
          performedByStaff: Boolean(req?.user),
        }
      );

      await invalidateServerCaches({ userId: ownerPublicId, publicServerId });
      await publishEvent(`user:${ownerPublicId}:servers`, { type: 'SERVER_ACTIVE', serverId: publicServerId });
    }

    await writeAudit(req, 'admin.server.unsuspend', 'server', publicServerId, {
      serverName: server.name,
      targetUserId: ownerPublicId,
    });

    return { server: formatPublicEntity(server, 'server') };
  } finally {
    await releaseLock(`server:${id}`, lockToken);
  }
};

module.exports = {
  calculateSuspensionExpiry,
  formatSuspensionDescription,
  suspendServer,
  unsuspendServer,
};