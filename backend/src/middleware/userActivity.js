const UserActivityLog = require('../models/UserActivityLog');

/**
 * Logs a user activity.
 * 
 * @param {Object} req - The Express request object (used to extract IP, userAgent, and user ID)
 * @param {String} action - The action string (e.g. 'server.create', 'auth.login.success')
 * @param {Object} metadata - Optional additional details (e.g. { serverName: 'Test' })
 */
async function logUserActivity(req, action, metadata = {}, explicitUserId = null) {
  try {
    const userId = explicitUserId || req?.user?.sub || req?.user?.id || req?.user?._id;
    if (!userId) {
      return; // Cannot log without a user ID
    }

    const xForwarded = req?.headers?.['x-forwarded-for'];
    const ip = (Array.isArray(xForwarded) ? xForwarded[0] : xForwarded?.split(',')[0]) || req?.socket?.remoteAddress || 'unknown';
    const userAgent = req?.headers?.['user-agent'] || 'unknown';

    // Inject session ID if available
    const sessionId = req?.user?.sessionId;
    if (sessionId) {
      metadata.sessionId = sessionId;
    }

    // Sanitize metadata to avoid leaking secrets
    const safeMetadata = sanitizeMeta(metadata);

    await UserActivityLog.create({
      userId,
      action,
      ip,
      userAgent,
      metadata: safeMetadata
    });

    // Also mirror this user activity directly into the global Admin AuditLog 
    // so admins can see all user actions seamlessly! (Skip if already logged manually)
    if (req && req.res) {
      // Attach to the end of the request to perfectly deduplicate with manual writeAudits
      req.res.on('finish', () => {
        if (req._auditLogged) return;
        try {
          const { writeAudit } = require('./audit');
          const resourceType = action.split('.')[0] || 'user';
          // Mark to prevent auditAuto from logging a duplicate
          req._auditLogged = true;
          writeAudit(req, action, resourceType, metadata?.resourceId || userId, safeMetadata).catch(() => {});
        } catch (auditErr) {}
      });
    }
  } catch (error) {
    // Fail silently in production to avoid crashing the request
    console.error('Error logging user activity:', error);
  }
}

function sanitizeMeta(meta) {
  try {
    if (!meta || typeof meta !== 'object') return meta;
    const sensitiveKeys = ['password', 'secret', 'token', 'authorization', 'clientsecret'];
    return JSON.parse(JSON.stringify(meta, (k, v) => {
      if (sensitiveKeys.includes(k.toLowerCase())) return '[redacted]';
      return v;
    }));
  } catch {
    return {};
  }
}

module.exports = { logUserActivity };
