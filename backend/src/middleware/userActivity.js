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

    const ip = req?.headers?.['x-forwarded-for']?.split(',')[0] || req?.socket?.remoteAddress || 'unknown';
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
