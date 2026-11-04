const parser = require('ua-parser-js');
const User = require('../../models/User');
const { getSettings } = require('../../lib/settings');
const { sendMailTemplate } = require('../../lib/mail');
const { deleteCache } = require('../../lib/redis');
const { writeAudit } = require('../../middleware/audit');
const { logUserActivity } = require('../../middleware/userActivity');
const SessionService = require('../../services/SessionService');
const { resolveClientIp, resolveClientLocation, resolveUserAgent } = require('../../utils/clientInfo');
const AppError = require('../../utils/AppError');

function serializeAuthUser(user) {
  return {
    id: user.publicId,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    coins: Number(user.coins || 0),
    pterodactylUserId: user.pterodactylUserId || null,
    resources: user.resources,
    emailVerified: Boolean(user.emailVerified),
  };
}

async function generateUniqueUsername(baseUsername) {
  let clean = (baseUsername || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
  if (clean.length < 3) clean = `user_${clean}`;
  let candidate = clean;
  let counter = 1;
  while (await User.exists({ username: candidate })) {
    const suffix = String(counter++);
    candidate = `${clean.slice(0, 20 - suffix.length - 1)}_${suffix}`;
  }
  return candidate;
}

async function sendLoginAlert(user, req, session = null) {
  try {
    const ip = session?.ip || resolveClientIp(req);
    const location = session?.location || await resolveClientLocation(req, ip);
    let device = session?.device;
    let browser = session?.browser;

    if (!device || !browser) {
      const ua = parser(resolveUserAgent(req));
      const deviceType = ['mobile', 'tablet'].includes(ua.device?.type) ? ua.device.type : 'desktop';
      if (!device) {
        if (ua.device?.vendor && ua.device?.model && ua.device.model !== 'K') {
          device = `${ua.device.vendor} ${ua.device.model}`.trim();
        } else if (ua.device?.model && ua.device.model !== 'K') {
          device = ua.device.model.trim();
        } else if (ua.os?.name) {
          device = ['mobile', 'tablet'].includes(deviceType)
            ? `${ua.os.name} Device`
            : (ua.os.name === 'macOS' || ua.os.name === 'Mac OS' ? 'Apple Mac' : `${ua.os.name} PC`);
        } else {
          device = 'Unknown Device';
        }
      }
      if (!browser) {
        browser = ua.browser?.name
          ? `${ua.browser.name} ${ua.browser.major || ua.browser.version || ''}`.trim()
          : 'Unknown Browser';
      }
    }

    const { getSettings } = require('../../lib/settings');
    const settings = await getSettings().catch(() => null);

    await sendMailTemplate({
      to: user.email,
      templateKey: 'loginAlert',
      data: {
        ip,
        location,
        device,
        browser,
        userAgent: req.get('User-Agent') || '',
        time: new Date().toUTCString(),
        username: user.username,
        siteName: settings?.siteName || 'PetroDash',
      },
    });
  } catch (err) {
    await writeAudit(req, 'auth.email.send_failed', 'auth', user.publicId, {
      template: 'loginAlert',
      error: err.message,
    }).catch(() => {});
  }
}

async function assertNotBanned(req, user, emailOrUsername) {
  const ban = user.ban || {};
  const isBanned = Boolean(ban.isBanned) && (!ban.until || new Date(ban.until) > new Date());
  if (!isBanned) return;

  req.user = { publicId: user.publicId, role: user.role, username: user.username };
  await writeAudit(req, 'auth.login.failed', 'auth', user.publicId, {
    reason: 'account_banned',
    ...(emailOrUsername ? { emailOrUsername } : {}),
    userId: user.publicId,
    username: user.username,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  await logUserActivity(req, 'auth.login.failed', {
    reason: 'account_banned',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  }, user.publicId);
  throw AppError.forbidden('Account banned', 'ERR_ACCOUNT_BANNED', {
    reason: String(ban.reason || ''),
    until: ban.until || null,
    username: user.username || '',
  });
}

async function finalizeLoginSession(req, user, loginMethod, startTime, extraAudit = {}) {
  const { token, session } = await SessionService.createSessionAndJwt(user, req);
  req.user = user;
  const sessionPubId = session.publicId;
  const userPubId = user.publicId;
  if (req.user) {
    req.user.id = userPubId;
    req.user.sub = userPubId;
    req.user.userId = userPubId;
    req.user.publicId = userPubId;
    req.user.sessionId = sessionPubId;
    delete req.user._id;
  }

  const location = session?.location || (await resolveClientLocation(req, req.ip));

  await writeAudit(req, 'auth.login.success', 'auth', userPubId, {
    loginMethod,
    ...extraAudit,
    userId: userPubId,
    email: user.email,
    location,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    durationMs: Date.now() - startTime,
    sessionId: sessionPubId,
  });

  await logUserActivity(req, 'auth.login.success', {
    loginMethod,
    sessionId: sessionPubId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  }, userPubId);

  await deleteCache(`user:auth:${user.publicId}`);
  sendLoginAlert(user, req, session);

  const s = await getSettings().catch(() => null);
  const requiresVerification = Boolean(s?.auth?.emailVerification && !user.emailVerified);

  return { token, user: serializeAuthUser(user), requiresVerification };
}

module.exports = {
  serializeAuthUser,
  generateUniqueUsername,
  sendLoginAlert,
  assertNotBanned,
  finalizeLoginSession,
};
