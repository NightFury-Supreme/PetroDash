const AuditLog = require('../models/AuditLog');

async function writeAudit(reqOrActorId, action, resourceTypeOrDetails, resourceIdOrDetails, detailsOrUndefined) {
  try {
    let actorId, actorRole, actorUsername, resourceType, resourceId, meta;
    
    // Handle both function signatures:
    // 1. writeAudit(actorId, action, details)
    // 2. writeAudit(req, action, resourceType, resourceId, details)
    
    if (reqOrActorId && typeof reqOrActorId === 'object' && reqOrActorId.headers) {
      // Case 2: writeAudit(req, action, resourceType, resourceId, details)
      const req = reqOrActorId;
      actorId = req.user?.sub || req.user?.id || req.user?._id;
      actorRole = req.user?.role || 'user';
      actorUsername = req.user?.username || 'unknown';
      resourceType = resourceTypeOrDetails;
      resourceId = resourceIdOrDetails;
      meta = detailsOrUndefined || {};
    } else {
      // Case 1: writeAudit(actorId, action, details)
      actorId = reqOrActorId;
      actorRole = 'admin';
      actorUsername = 'admin';
      resourceType = 'admin';
      resourceId = resourceTypeOrDetails?.itemId || null;
      meta = resourceTypeOrDetails || {};
    }
    
    // Ensure actorId is a valid ObjectId or null
    if (actorId && typeof actorId === 'string' && !/^[0-9a-fA-F]{24}$/.test(actorId)) {
      // Invalid actorId format - logged silently
      actorId = null;
    }
    
    await AuditLog.create({
      actorId,
      actorRole,
      actorUsername,
      action,
      resourceType,
      resourceId,
      // Avoid logging tokens or raw headers
      meta: sanitizeMeta(meta),
      success: true
    });
  } catch (error) {
    // Audit log error logged silently for production
  }
}

function sanitizeMeta(meta) {
  try {
    if (!meta || typeof meta !== 'object') return meta;
    const clone = JSON.parse(JSON.stringify(meta));
    const sensitiveKeys = ['authorization','auth','token','password','secret','clientSecret'];
    for (const k of Object.keys(clone)) {
      if (sensitiveKeys.includes(k.toLowerCase())) clone[k] = '[redacted]';
    }
    return clone;
  } catch {
    return {};
  }
}

module.exports = { writeAudit };


