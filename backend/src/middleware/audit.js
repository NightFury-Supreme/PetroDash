const AuditLog = require('../models/AuditLog');

const logQueue = [];
let isFlushing = false;

// Async batch flusher (every 5 seconds)
setInterval(async () => {
  if (isFlushing || logQueue.length === 0) return;
  isFlushing = true;
  
  const batch = logQueue.splice(0, logQueue.length);
  
  try {
    await AuditLog.insertMany(batch, { ordered: false });
  } catch (err) {
    console.error('[Audit] Failed to flush batch:', err.message);
    // If it's a massive failure, we might lose logs here. A retry mechanism could be added.
  } finally {
    isFlushing = false;
  }
}, 5000);

// Graceful shutdown: flush any remaining logs before the server exits
const flushQueueSync = () => {
  if (logQueue.length > 0) {
    try {
      console.log(`[Audit] Flushing ${logQueue.length} logs before shutdown...`);
      AuditLog.insertMany(logQueue, { ordered: false }).catch(() => {});
      logQueue.length = 0;
    } catch (e) {
      console.error('[Audit] Shutdown flush error', e);
    }
  }
};

process.on('SIGTERM', flushQueueSync);
process.on('SIGINT', flushQueueSync);

async function writeAudit(reqOrActorId, action, resourceTypeOrDetails, resourceIdOrDetails, detailsOrUndefined) {
  try {
    let actorId, actorRole, actorUsername, resourceType, resourceId, meta, ip, userAgent, requestId, sessionId;
    
    if (reqOrActorId && typeof reqOrActorId === 'object' && reqOrActorId.headers) {
      const req = reqOrActorId;
      actorId = req.user?.sub || req.user?.id || req.user?._id;
      actorRole = req.user?.role || 'user';
      actorUsername = req.user?.username || 'unknown';
      sessionId = req.user?.sessionId;
      resourceType = resourceTypeOrDetails;
      resourceId = resourceIdOrDetails;
      meta = detailsOrUndefined || {};
      const xForwarded = req.headers['x-forwarded-for'];
      ip = (Array.isArray(xForwarded) ? xForwarded[0] : xForwarded?.split(',')[0]) || req.socket?.remoteAddress || req.ip;
      userAgent = req.headers['user-agent'];
      requestId = req.requestId;
      req._auditLogged = true; // Mark as logged to prevent auditAuto fallback
    } else {
      actorId = reqOrActorId;
      if (resourceIdOrDetails !== undefined) {
        actorRole = 'system';
        actorUsername = 'system';
        resourceType = resourceTypeOrDetails;
        resourceId = resourceIdOrDetails;
        meta = detailsOrUndefined || {};
      } else {
        actorRole = 'admin';
        actorUsername = 'admin';
        resourceType = 'admin';
        resourceId = resourceTypeOrDetails?.itemId || null;
        meta = resourceTypeOrDetails || {};
      }
    }
    
    if (actorId && typeof actorId === 'string' && !/^[0-9a-fA-F]{24}$/.test(actorId)) {
      actorId = null;
    }
    
    const httpMethod = (reqOrActorId && reqOrActorId.method) || (meta && meta.method);
    const reqPath = (reqOrActorId && (reqOrActorId.originalUrl || reqOrActorId.url)) || (meta && meta.path);
    const statusCode = (reqOrActorId && reqOrActorId.res && reqOrActorId.res.statusCode) || (meta && (meta.status || meta.statusCode));
    const durationMs = meta && meta.durationMs;
    const responsePreview = meta && meta.responsePreview;
    const isSuccess = meta && meta.success !== undefined ? meta.success : true;
    
    // Strict Category Map - No Guessing Game
    const EXACT_CATEGORY_MAP = {
      // Billing / Economy
      'shop.purchase': 'billing_event',
      'payment.purchase.completed': 'billing_event',
      'earn.session.start': 'billing_event',
      'earn.claim': 'billing_event',
      'earn.ad.verified': 'billing_event',
      'shop.payment.create': 'billing_event',
      'shop.payment.capture': 'billing_event',
      'shop.payment.cancel': 'billing_event',
      
      // User Activity
      'server.create': 'user_activity',
      'server.update': 'user_activity',
      'server.delete': 'user_activity',
      'user.update': 'user_activity',
      'user.delete': 'user_activity',
      'ticket.create': 'user_activity',
      'ticket.reply': 'user_activity',
      'ticket.status_change': 'user_activity',
      'gifts.redeem': 'user_activity',
      
      // System & Auth
      'auth.login': 'system_event',
      'auth.login.success': 'system_event',
      'auth.login.failed': 'system_event',
      'auth.logout': 'system_event',
      'auth.register.success': 'system_event',
      'auth.email.verified': 'system_event',
      'auth.password.reset.success': 'system_event',
      
      // Admin Activity
      'admin.user.update': 'admin_activity',
      'admin.user.ban': 'admin_activity',
      'admin.user.unban': 'admin_activity',
      'admin.user.delete': 'admin_activity',
      'admin.server.update': 'admin_activity',
      'admin.server.delete': 'admin_activity',
      'admin.ticket.reply': 'admin_activity',
      'admin.ticket.update': 'admin_activity',
      'admin.ticket.delete': 'admin_activity'
    };

    // Assign severity & category strictly
    let severity = meta?.severity || (isSuccess ? 'INFO' : 'ERROR');
    
    // If not manually passed, lookup exact category. If not found, default to system_event.
    let category = meta?.category || EXACT_CATEGORY_MAP[action];
    
    // Fallbacks for safety net dynamically generated actions (e.g. from auditAuto)
    if (!category) {
      if (action.startsWith('admin.')) category = 'admin_activity';
      else if (action.startsWith('auth.')) category = 'system_event';
      else category = 'data_access'; // Default for unmapped routes
    }
    
    // Ensure fallback requestId & sessionId
    if (!requestId) requestId = meta?.requestId;
    if (!sessionId) sessionId = meta?.sessionId;

    const logEntry = {
      actorId,
      actorRole,
      actorUsername,
      action,
      resourceType,
      resourceId,
      meta: sanitizeMeta(meta),
      success: isSuccess,
      ip,
      userAgent,
      method: httpMethod,
      path: reqPath,
      statusCode,
      durationMs,
      responsePreview,
      severity,
      category,
      requestId,
      sessionId
    };

    // Push to memory queue for async batching
    logQueue.push(logEntry);
    
  } catch (error) {
    // Audit log error logged silently for production
  }
}

function sanitizeMeta(meta) {
  try {
    if (!meta || typeof meta !== 'object') return meta;
    const sensitiveKeys = ['authorization','auth','token','password','secret','clientsecret','passwordhash','apikey'];
    return JSON.parse(JSON.stringify(meta, (k, v) => {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') return undefined;
      if (sensitiveKeys.includes(k.toLowerCase())) return '[redacted]';
      return v;
    }));
  } catch {
    return {};
  }
}

module.exports = { writeAudit };
