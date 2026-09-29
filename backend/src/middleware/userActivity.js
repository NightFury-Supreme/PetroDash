const { writeAudit } = require('./audit');

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


    // Auto-detect administrator actions and inject admin identity
    const callerId = req?.user?.sub || req?.user?.userId || req?.user?.id || req?.user?._id;
    const isCallerAdmin = req?.user?.role === 'admin';
    const isAdminAction = typeof action === 'string' && action.startsWith('admin.');
    const isTargetingOther = Boolean(explicitUserId && callerId && String(explicitUserId) !== String(callerId));

    // Inject session ID only for user's own actions; never assign admin sessionId to user log
    const sessionId = req?.user?.sessionId;
    if (sessionId) {
      if (isCallerAdmin || isAdminAction || isTargetingOther) {
        metadata.adminSessionId = sessionId;
      } else if (!metadata.sessionId) {
        metadata.sessionId = sessionId;
      }
    }

    if (isCallerAdmin || isAdminAction || isTargetingOther) {
      if (!metadata.adminId && callerId) {
        metadata.adminId = String(callerId);
      }
      if (!metadata.adminUsername && req?.user?.username) {
        metadata.adminUsername = req.user.username;
      }
      if (!metadata.adminRole && (req?.user?.role || isCallerAdmin)) {
        metadata.adminRole = req.user?.role || 'admin';
      }
      metadata.performedByAdmin = true;
    }

    const resourceType = action.split('.')[0] || 'user';
    const resourceId = metadata?.resourceId || String(userId);
    metadata.targetUserId = String(userId);

    await writeAudit(req, action, resourceType, resourceId, metadata);

  } catch (error) {
    // Fail silently in production to avoid crashing the request
    console.error('Error logging user activity:', error);
  }
}

module.exports = { logUserActivity };
