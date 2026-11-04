const { writeAudit } = require('./audit');

async function logUserActivity(req, action, metadata = {}, explicitUserId = null) {
  try {
    if (typeof action === 'string' && action.startsWith('admin.')) {
      return;
    }

    const userId = explicitUserId || req?.user?.publicId || req?.user?.sub || req?.user?.id;
    if (!userId) {
      return;
    }

    const callerId = req?.user?.publicId || req?.user?.sub || req?.user?.userId || req?.user?.id;
    const isTargetingOther = Boolean(explicitUserId && callerId && String(explicitUserId) !== String(callerId));

    if (isTargetingOther) {
      const {
        sessionId: _s,
        adminSessionId: _as,
        adminIp: _ai,
        adminUserAgent: _au,
        adminId: _aid,
        adminUsername: _aun,
        adminRole: _ar,
        ...cleanMeta
      } = metadata;

      const resourceType = action.split('.')[0] || 'user';
      const resourceId = cleanMeta?.resourceId || String(userId);
      cleanMeta.targetUserId = String(userId);
      cleanMeta.performedByStaff = true;
      cleanMeta.actorRole = req?.user?.role || 'admin';
      cleanMeta.actorUsername = req?.user?.username || 'Staff Operator';

      await writeAudit(callerId, action, resourceType, resourceId, cleanMeta);
      return;
    }

    const sessionId = req?.user?.sessionId;
    if (sessionId && !metadata.sessionId) {
      metadata.sessionId = sessionId;
    }

    const resourceType = action.split('.')[0] || 'user';
    const resourceId = metadata?.resourceId || String(userId);
    metadata.targetUserId = String(userId);

    await writeAudit(req, action, resourceType, resourceId, metadata);
  } catch (_err) {
  }
}

module.exports = { logUserActivity };
