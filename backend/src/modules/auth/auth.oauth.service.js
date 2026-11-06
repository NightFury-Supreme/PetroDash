const jwt = require('jsonwebtoken');
const { getSettings } = require('../../lib/settings');
const { invalidateUserCaches } = require('../../utils/userCacheInvalidation');
const SessionService = require('../../services/SessionService');
const DiscordService = require('../../services/discord');
const { writeAudit } = require('../../middleware/audit');
const { logUserActivity } = require('../../middleware/userActivity');
const { sendLoginAlert, assertNotBanned } = require('./auth.helpers');
const { configurePassport, reconfigureStrategies } = require('./auth.oauth.strategies');

function sanitizeOAuthRedirect(raw) {
  if (!raw || typeof raw !== 'string') return '/dashboard';
  try {
    const decoded = decodeURIComponent(raw).trim();
    if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\')) return '/dashboard';
    if (/[:@]/.test(decoded) || /^\/(https?:|\/\/|www\.)/i.test(decoded) || decoded.includes('://')) return '/dashboard';
    const lower = decoded.toLowerCase();
    if (
      lower.startsWith('/login') ||
      lower.startsWith('/register') ||
      lower.startsWith('/auth') ||
      lower.startsWith('/2fa') ||
      lower.startsWith('/forgot') ||
      lower.startsWith('/verify') ||
      lower.startsWith('/banned')
    ) return '/dashboard';
    return decoded;
  } catch (_decodeErr) {
    return '/dashboard';
  }
}

async function handleOAuthSuccess(req, provider) {
  const startTime = Date.now();
  const user = req.user;

  await assertNotBanned(req, user);

  if (!user.emailVerified) {
    user.emailVerified = true;
    await user.save();
    await invalidateUserCaches(user.publicId);
  }

  try {
    const avatarService = require('../../services/avatarService');
    await avatarService.syncOAuthAvatar(user, provider);
  } catch (_avatarErr) {}

  if (user.tfaEnabled) {
    const tempToken = jwt.sign({ sub: user.publicId, type: '2fa' }, process.env.JWT_SECRET, { expiresIn: '5m', algorithm: 'HS256' });
    req.user = { publicId: user.publicId, role: user.role, username: user.username };
    await writeAudit(req, `auth.oauth.${provider}.2fa_required`, 'auth', user.publicId, {
      provider,
      loginMethod: provider,
      userId: user.publicId,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    return { requires2FA: true, tempToken };
  }

  const { token, session } = await SessionService.createSessionAndJwt(user, req);

  let joinResult = null;
  if (provider === 'discord') {
    const settings = await getSettings();
    const autoJoinEnabled = settings?.auth?.discord?.autoJoin;
    const botToken = settings?.auth?.discord?.botToken;
    const guildId = settings?.auth?.discord?.guildId;
    const accessToken = req.oauthAccessToken;

    if (autoJoinEnabled && botToken && guildId && accessToken && user.oauthProviders?.discord?.id) {
      try {
        joinResult = await DiscordService.addUserToServer(
          user.oauthProviders.discord.id,
          accessToken,
          botToken,
          guildId
        );
      } catch (joinErr) {
        joinResult = { success: false, error: joinErr.message };
      }
    }
  }

  await writeAudit(req, `auth.oauth.${provider}.success`, 'auth', user.publicId, {
    provider,
    loginMethod: provider,
    userId: user.publicId,
    username: user.username,
    email: user.email,
    sessionId: session?.publicId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    durationMs: Date.now() - startTime,
    discordJoinResult: joinResult ? (joinResult.success ? 'success' : 'failed') : undefined,
  });

  await logUserActivity(req, 'auth.login.success', {
    loginMethod: provider,
    sessionId: session?.publicId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  }, user.publicId);

  if (user?.email) {
    sendLoginAlert(user, req, session);
  }

  return { token, joinResult };
}

module.exports = {
  sanitizeOAuthRedirect,
  configurePassport,
  reconfigureStrategies,
  handleOAuthSuccess,
};
