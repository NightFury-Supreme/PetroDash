/**
 * OAuth Callback and Post-Login Handlers
 */

const SessionService = require('../../services/SessionService');
const DiscordService = require('../../services/discord');
const { getSettings } = require('../../lib/settings');
const { deleteCache } = require('../../lib/redis');
const { writeAudit } = require('../../middleware/audit');
const { logUserActivity } = require('../../middleware/userActivity');
const { sendMailTemplate } = require('../../lib/mail');

async function handleOAuthSuccess(req, provider) {
  const startTime = Date.now();
  const user = req.user;

  const { token, session } = await SessionService.createSessionAndJwt(user, req);
  if (session?._id) {
    req.user.sessionId = session._id.toString();
  }

  try {
    if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
      await deleteCache(`user:${user._id}:profile`);
      await deleteCache(`user:auth:${user._id}`);
    }
  } catch {}

  let joinResult = null;
  if (provider === 'discord') {
    const settings = await getSettings();
    const autoJoinEnabled = settings?.auth?.discord?.autoJoin;
    const botToken = settings?.auth?.discord?.botToken;
    const guildId = settings?.auth?.discord?.guildId;
    const accessToken = user.oauthProviders?.discord?.accessToken;

    if (autoJoinEnabled && botToken && guildId && accessToken && user.oauthProviders?.discord?.id) {
      try {
        joinResult = await DiscordService.addUserToServer(
          user.oauthProviders.discord.id,
          accessToken,
          botToken,
          guildId
        );
      } catch {}
    }
  }

  await writeAudit(req, `auth.oauth.${provider}.success`, 'auth', user._id.toString(), {
    provider,
    loginMethod: provider,
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    durationMs: Date.now() - startTime,
    discordJoinResult: joinResult ? (joinResult.success ? 'success' : 'failed') : undefined,
  });

  await logUserActivity(
    req,
    'auth.login.success',
    { loginMethod: provider, ...(session?._id ? { sessionId: session._id.toString() } : {}) },
    user._id.toString()
  );

  try {
    if (user?.email) {
      await sendMailTemplate({
        to: user.email,
        templateKey: 'loginAlert',
        data: {
          username: user.username,
          ip: req.ip,
          userAgent: req.get('User-Agent') || 'Unknown',
          time: new Date().toLocaleString(),
          serverName: process.env.SERVER_NAME || 'Dashboard',
          title: 'New login to your account',
          snippet: `You signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth`,
          reason: `OAuth login (${provider})`,
        },
      });
    }
  } catch {}

  return { token, joinResult };
}

module.exports = {
  handleOAuthSuccess,
};
