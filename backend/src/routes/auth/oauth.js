const express = require('express');
const passport = require('passport');
const User = require('../../models/User');
const { getSettings } = require('../../lib/settings');
const { getCache, setCache } = require('../../lib/redis');
const UserCreationService = require('../../services/userCreation');
const DiscordService = require('../../services/discord');
const { writeAudit } = require('../../middleware/audit');
const { logUserActivity } = require('../../middleware/userActivity');
const { requireAuth } = require('../../middleware/auth');
const AppError = require('../../utils/AppError');
const { reconfigureStrategies } = require('./oauthStrategies');
const { handleOAuthSuccess } = require('./oauthHandlers');

const router = express.Router();

// Discord OAuth Initiation
router.get('/discord', async (req, res, next) => {
  await writeAudit(req, 'auth.oauth.discord.initiated', 'auth', null, {
    provider: 'discord',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  await reconfigureStrategies();

  const options = {};
  if (req.query.redirect) {
    options.state = Buffer.from(JSON.stringify({ redirect: req.query.redirect })).toString('base64');
  }

  passport.authenticate('discord', options)(req, res, next);
});

// Discord OAuth Callback
router.get('/discord/callback', async (req, res, next) => {
  await reconfigureStrategies();
  passport.authenticate('discord', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` })(req, res, next);
}, async (req, res, next) => {
  try {
    if (!req.user) {
      await writeAudit(req, 'auth.oauth.discord.failed', 'auth', null, {
        provider: 'discord',
        reason: 'no_user_returned',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      await logUserActivity(req, 'auth.login.failed', { reason: 'oauth_failed', provider: 'discord' });
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    const { token, joinResult } = await handleOAuthSuccess(req, 'discord');

    const callbackUrl = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
    callbackUrl.searchParams.set('token', token);

    // Decode redirect from OAuth state and forward it
    try {
      const rawState = req.query.state || (req.user && req.user._state);
      if (rawState) {
        const stateObj = JSON.parse(Buffer.from(String(rawState), 'base64').toString('utf8'));
        if (stateObj?.redirect && typeof stateObj.redirect === 'string' && stateObj.redirect.startsWith('/') && !stateObj.redirect.startsWith('//')) {
          callbackUrl.searchParams.set('redirect', stateObj.redirect);
        }
      }
    } catch {
      // Ignore malformed state — degrade gracefully to /dashboard
    }

    if (joinResult) {
      callbackUrl.searchParams.set('discord_join', joinResult.success ? 'success' : 'failed');
      if (!joinResult.success) {
        callbackUrl.searchParams.set('discord_error', joinResult.error || 'Unknown error');
      }
    }

    res.redirect(callbackUrl.toString());
  } catch (error) {
    next(error);
  }
});

// Google OAuth Initiation
router.get('/google', async (req, res, next) => {
  await writeAudit(req, 'auth.oauth.google.initiated', 'auth', null, {
    provider: 'google',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  await reconfigureStrategies();

  const options = { scope: ['profile', 'email'] };
  if (req.query.redirect) {
    options.state = Buffer.from(JSON.stringify({ redirect: req.query.redirect })).toString('base64');
  }

  passport.authenticate('google', options)(req, res, next);
});

// Google OAuth Callback
router.get('/google/callback', async (req, res, next) => {
  await reconfigureStrategies();
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` })(req, res, next);
}, async (req, res, next) => {
  try {
    if (!req.user) {
      await writeAudit(req, 'auth.oauth.google.failed', 'auth', null, {
        provider: 'google',
        reason: 'no_user_returned',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      await logUserActivity(req, 'auth.login.failed', { reason: 'oauth_failed', provider: 'google' });
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    const { token } = await handleOAuthSuccess(req, 'google');

    const callbackUrl = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
    callbackUrl.searchParams.set('token', token);

    // Decode redirect from OAuth state and forward it
    try {
      const rawState = req.query.state || (req.user && req.user._state);
      if (rawState) {
        const stateObj = JSON.parse(Buffer.from(String(rawState), 'base64').toString('utf8'));
        if (stateObj?.redirect && typeof stateObj.redirect === 'string' && stateObj.redirect.startsWith('/') && !stateObj.redirect.startsWith('//')) {
          callbackUrl.searchParams.set('redirect', stateObj.redirect);
        }
      }
    } catch {
      // Ignore malformed state — degrade gracefully to /dashboard
    }

    res.redirect(callbackUrl.toString());
  } catch (error) {
    next(error);
  }
});

// OAuth Status (Public configuration status)
router.get('/status', async (req, res, next) => {
  try {
    const cached = await getCache('auth:oauth:status');
    if (cached) return res.json(cached);

    const settings = await getSettings();
    const result = {
      discord: {
        enabled: settings?.auth?.discord?.enabled || false,
        clientId: settings?.auth?.discord?.clientId || '',
      },
      google: {
        enabled: settings?.auth?.google?.enabled || false,
        clientId: settings?.auth?.google?.clientId || '',
      },
    };

    await setCache('auth:oauth:status', result, 60);
    res.json(result);
  } catch (_error) {
    next(AppError.internal('Failed to get OAuth status', 'ERR_OAUTH_STATUS'));
  }
});

// Reconfigure strategies (for admin use)
router.post('/reconfigure', async (req, res, next) => {
  try {
    await reconfigureStrategies();
    res.json({ success: true, message: 'OAuth strategies reconfigured' });
  } catch (_error) {
    next(AppError.internal('Failed to reconfigure OAuth strategies', 'ERR_OAUTH_RECONFIGURE'));
  }
});

// Create Pterodactyl user for existing user
router.post('/create-pterodactyl-user', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      throw AppError.badRequest('Valid user ID is required', 'ERR_INVALID_ID');
    }

    const user = await User.findById(String(userId));
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');
    if (user.pterodactylUserId) throw AppError.conflict('User already has Pterodactyl account', 'ERR_PTERO_EXISTS');

    await UserCreationService.createPterodactylUser(user);
    await user.save();

    res.json({
      success: true,
      message: 'Pterodactyl user created successfully',
      pterodactylUserId: user.pterodactylUserId,
    });
  } catch (error) {
    next(error);
  }
});

// Join Discord Server endpoint
router.post('/discord/join', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId || req.user.sub);
    if (!user || !user.oauthProviders?.discord?.id || !user.oauthProviders?.discord?.accessToken) {
      throw AppError.badRequest('Discord account is not linked or access token is missing', 'ERR_DISCORD_NOT_LINKED');
    }

    const settings = await getSettings();
    const botToken = settings?.auth?.discord?.botToken;
    const guildId = settings?.auth?.discord?.guildId;

    if (!botToken || !guildId) {
      throw AppError.badRequest('Discord server integration is not configured', 'ERR_DISCORD_NOT_CONFIGURED');
    }

    const joinResult = await DiscordService.addUserToServer(
      user.oauthProviders.discord.id,
      user.oauthProviders.discord.accessToken,
      botToken,
      guildId
    );

    if (joinResult.success) {
      return res.json({ success: true, message: 'Successfully joined Discord server' });
    }
    throw AppError.badRequest(joinResult.error || 'Failed to join Discord server', 'ERR_DISCORD_JOIN_FAILED');
  } catch (error) {
    next(error);
  }
});

module.exports = { router, reconfigureStrategies };
