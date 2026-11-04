const AuditLog = require('../models/AuditLog');

const { resolveClientIp, resolveUserAgent, resolveClientLocation } = require('../utils/clientInfo');
const { generatePublicId } = require('../utils/publicId');

const logQueue = [];
let isFlushing = false;

const EXACT_CATEGORY_MAP = {
  'shop.purchase': 'billing_event',
  'payment.purchase.completed': 'billing_event',
  'earn.session.start': 'billing_event',
  'earn.claim': 'billing_event',
  'earn.callback.claim': 'billing_event',
  'earn.ad.verified': 'billing_event',
  'earn.linkvertise': 'billing_event',
  'shop.payment.create': 'billing_event',
  'shop.payment.capture': 'billing_event',
  'shop.payment.cancel': 'billing_event',
  'referral.reward.referred': 'billing_event',
  'referral.reward.referrer': 'billing_event',

  'server.create': 'user_activity',
  'server.queued': 'user_activity',
  'server.update': 'user_activity',
  'server.delete': 'user_activity',
  'server.suspend': 'user_activity',
  'server.unsuspend': 'user_activity',
  'user.update': 'user_activity',
  'user.delete': 'user_activity',
  'ticket.create': 'user_activity',
  'ticket.reply': 'user_activity',
  'ticket.status_change': 'user_activity',
  'gifts.redeem': 'user_activity',
  'gift.redeem': 'user_activity',
  'gift.create': 'user_activity',
  'referral.code.update': 'user_activity',
  'auth.profile.update': 'user_activity',
  'auth.account.update': 'user_activity',
  'auth.account.delete': 'user_activity',
  'auth.email.update': 'user_activity',
  'panel.password.reset': 'user_activity',

  'auth.login': 'system_event',
  'auth.login.success': 'system_event',
  'auth.login.failed': 'system_event',
  'auth.login.error': 'system_event',
  'auth.logout': 'system_event',
  'auth.register.success': 'system_event',
  'auth.register.failed': 'system_event',
  'auth.email.verified': 'system_event',
  'auth.password.reset.requested': 'system_event',
  'auth.password.reset.success': 'system_event',
  'auth.password.update': 'system_event',
  'auth.2fa': 'system_event',
  'auth.2fa.setup_initiated': 'system_event',
  'auth.2fa.enable': 'system_event',
  'auth.2fa.disable': 'system_event',
  'auth.session.revoke': 'system_event',

  'admin.user.update': 'admin_activity',
  'admin.user.ban': 'admin_activity',
  'admin.user.unban': 'admin_activity',
  'admin.user.delete': 'admin_activity',
  'admin.server.update': 'admin_activity',
  'admin.server.delete': 'admin_activity',
  'admin.ticket.reply': 'admin_activity',
  'admin.ticket.update': 'admin_activity',
  'admin.ticket.delete': 'admin_activity',

  'system.compliance.suspend': 'system_event',
  'system.compliance.owner_error': 'system_event',
  'system.compliance.sweep_failed': 'system_event',
  'server.compliance.suspended': 'system_event',
  'server.compliance.suspend_failed': 'system_event',
  'server.unsuspend': 'system_event',
  'server.unsuspend_failed': 'system_event',
  'server.auto_unsuspend': 'system_event',
};

const SENSITIVE_KEYS = new Set([
  'authorization',
  'auth',
  'token',
  'password',
  'secret',
  'clientsecret',
  'passwordhash',
  'apikey',
]);

setInterval(async () => {
  if (isFlushing || logQueue.length === 0) return;
  isFlushing = true;

  const batch = logQueue.splice(0, logQueue.length);

  try {
    await AuditLog.insertMany(batch, { ordered: false });
  } catch (_flushErr) {
  } finally {
    isFlushing = false;
  }
}, 5000);

async function flushAuditQueue() {
  if (logQueue.length === 0) return;
  const batch = logQueue.splice(0, logQueue.length);
  try {
    await AuditLog.insertMany(batch, { ordered: false });
  } catch (_err) {}
}

const flushQueueSync = () => {
  if (logQueue.length > 0) {
    try {
      const batch = logQueue.splice(0, logQueue.length);
      AuditLog.insertMany(batch, { ordered: false }).catch(() => {});
    } catch (_syncFlushErr) {
    }
  }
};

process.on('SIGTERM', flushQueueSync);
process.on('SIGINT', flushQueueSync);

async function writeAudit(reqOrActorId, action, resourceTypeOrDetails, resourceIdOrDetails, detailsOrUndefined) {
  try {
    let actorId, actorRole, actorUsername, resourceType, resourceId, meta, ip, userAgent, requestId, sessionId;

    if (
      reqOrActorId &&
      typeof reqOrActorId === 'object' &&
      (reqOrActorId.headers || reqOrActorId.ip || reqOrActorId.socket || reqOrActorId.user)
    ) {
      const req = reqOrActorId;
      if (!req._auditedActions) req._auditedActions = new Set();
      if (req._auditedActions.has(action)) {
        return;
      }
      req._auditedActions.add(action);
      actorId = req.user?.publicId || req.user?.sub || req.user?.id;
      actorRole = req.user?.role || 'user';
      actorUsername = req.user?.username || 'unknown';
      sessionId = req.user?.sessionId;
      resourceType = resourceTypeOrDetails;
      resourceId = resourceIdOrDetails;
      meta = detailsOrUndefined || {};
      ip = resolveClientIp(req, meta);
      userAgent = resolveUserAgent(req, meta);
      requestId = req.requestId;
      req._auditLogged = true;
    } else {
      actorId = reqOrActorId;
      if (resourceIdOrDetails !== undefined) {
        meta = detailsOrUndefined || {};
        actorRole = meta.actorRole || 'system';
        actorUsername = meta.actorUsername || 'system';
        resourceType = resourceTypeOrDetails;
        resourceId = resourceIdOrDetails;
      } else {
        meta = resourceTypeOrDetails || {};
        actorRole = meta.actorRole || 'system';
        actorUsername = meta.actorUsername || 'system';
        resourceType = meta.resourceType || 'system';
        resourceId = resourceTypeOrDetails?.itemId || null;
      }
    }

    if (meta && typeof meta === 'object') {
      delete meta.actorRole;
      delete meta.actorUsername;
    }

    let location = meta?.location || reqOrActorId?.userSession?.location || null;
    if (!location && ip && ip !== 'unknown' && ip !== '127.0.0.1') {
      try {
        location = await resolveClientLocation(reqOrActorId, ip);
      } catch (_locErr) {}
    }

    const httpMethod = (reqOrActorId && reqOrActorId.method) || (meta && meta.method);
    const reqPath = (reqOrActorId && (reqOrActorId.originalUrl || reqOrActorId.url)) || (meta && meta.path);
    const statusCode =
      (reqOrActorId && reqOrActorId.res && reqOrActorId.res.statusCode) ||
      (meta && (meta.status || meta.statusCode));
    const durationMs = meta && meta.durationMs;
    const responsePreview = meta && meta.responsePreview;
    const isSuccess = meta && meta.success !== undefined ? meta.success : true;

    const severity = meta?.severity || (isSuccess ? 'INFO' : 'ERROR');

    let category = meta?.category || EXACT_CATEGORY_MAP[action];
    if (!category) {
      if (action.startsWith('admin.')) category = 'admin_activity';
      else if (
        action.startsWith('auth.') ||
        action.startsWith('system.') ||
        action.startsWith('server.compliance.') ||
        action.startsWith('server.auto_')
      ) {
        category = 'system_event';
      } else {
        category = 'data_access';
      }
    }

    if (!requestId) requestId = meta?.requestId;
    if (!sessionId) sessionId = meta?.sessionId;

    let resolvedTargetUserId = null;
    if (meta?.targetUserId) {
      resolvedTargetUserId = String(meta.targetUserId);
    } else if (resourceId && (resourceType === 'user' || resourceType === 'auth' || resourceType === 'user_profile')) {
      resolvedTargetUserId = String(resourceId);
    }

    if (meta && typeof meta === 'object') {
      delete meta.targetUserId;
      delete meta.userId;
      delete meta.sessionId;
      delete meta.ip;
      delete meta.userAgent;
      delete meta.location;
    }

    const logEntry = {
      publicId: generatePublicId('auditLog'),
      actorId,
      actorRole,
      actorUsername,
      action,
      resourceType,
      resourceId,
      targetUserId: resolvedTargetUserId,
      meta: sanitizeMeta(meta),
      success: isSuccess,
      ip,
      location,
      userAgent,
      method: httpMethod,
      path: reqPath,
      statusCode,
      durationMs,
      responsePreview,
      severity,
      category,
      requestId,
      sessionId,
    };

    logQueue.push(logEntry);
  } catch (_auditError) {
  }
}

function sanitizeMeta(meta) {
  try {
    if (!meta || typeof meta !== 'object') return meta;
    return JSON.parse(
      JSON.stringify(meta, (k, v) => {
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') return undefined;
        if (SENSITIVE_KEYS.has(k.toLowerCase())) return '[redacted]';
        return v;
      })
    );
  } catch (_sanitizeErr) {
    return {};
  }
}

module.exports = { writeAudit, flushAuditQueue: flushQueueSync };

