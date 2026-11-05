const passport = require('passport');
const { writeAudit } = require('../../middleware/audit');
const { logUserActivity } = require('../../middleware/userActivity');
const oauthService = require('./auth.oauth.service');

function getFrontendBase() {
  if (!process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL environment variable is required');
  }
  return process.env.FRONTEND_URL.replace(/\/+$/, '');
}

function extractSafeRedirect(rawState) {
  if (!rawState) return null;
  try {
    const stateObj = JSON.parse(Buffer.from(String(rawState), 'base64').toString('utf8'));
    const safeRedirect = oauthService.sanitizeOAuthRedirect(stateObj?.redirect);
    return safeRedirect !== '/dashboard' ? safeRedirect : null;
  } catch (_stateErr) {
    return null;
  }
}

exports.initiateDiscord = async (req, res, next) => {
  await writeAudit(req, 'auth.oauth.discord.initiated', 'auth', null, {
    provider: 'discord',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  await oauthService.reconfigureStrategies();

  const options = { session: false };
  if (req.query.redirect || req.query.ref) {
    options.state = Buffer.from(JSON.stringify({ redirect: req.query.redirect, ref: req.query.ref })).toString('base64');
  }

  passport.authenticate('discord', options)(req, res, next);
};

exports.authenticateDiscord = async (req, res, next) => {
  await oauthService.reconfigureStrategies();
  passport.authenticate('discord', { session: false, failureRedirect: `${getFrontendBase()}/login?error=oauth_failed` })(req, res, next);
};

exports.callbackDiscord = async (req, res, _next) => {
  const frontendBase = getFrontendBase();
  try {
    if (!req.user) {
      await writeAudit(req, 'auth.oauth.discord.failed', 'auth', null, {
        provider: 'discord',
        reason: 'no_user_returned',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      await logUserActivity(req, 'auth.login.failed', { reason: 'oauth_failed', provider: 'discord' });
      return res.redirect(`${frontendBase}/login?error=oauth_failed`);
    }

    const result = await oauthService.handleOAuthSuccess(req, 'discord');
    const callbackUrl = new URL(`${frontendBase}/auth/callback`);

    const safeRedirect = extractSafeRedirect(req.query.state || (req.user && req.user._state));
    if (safeRedirect) {
      callbackUrl.searchParams.set('redirect', safeRedirect);
    }

    if (result.requires2FA) {
      const twoFaUrl = new URL(`${frontendBase}/2fa`);
      twoFaUrl.searchParams.set('temp_token', result.tempToken);
      if (safeRedirect) {
        twoFaUrl.searchParams.set('redirect', safeRedirect);
      }
      return res.redirect(twoFaUrl.toString());
    }

    callbackUrl.searchParams.set('token', result.token);

    if (result.joinResult) {
      callbackUrl.searchParams.set('discord_join', result.joinResult.success ? 'success' : 'failed');
      if (!result.joinResult.success && result.joinResult.error) {
        callbackUrl.searchParams.set('discord_error', result.joinResult.error);
      }
    }

    return res.redirect(callbackUrl.toString());
  } catch (error) {
    if (error && error.code === 'ERR_ACCOUNT_BANNED') {
      return res.redirect(`${frontendBase}/login?error=ERR_ACCOUNT_BANNED`);
    }
    await writeAudit(req, 'auth.oauth.discord.error', 'auth', null, {
      provider: 'discord',
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }).catch(() => {});
    return res.redirect(`${frontendBase}/login?error=oauth_failed`);
  }
};

exports.initiateGoogle = async (req, res, next) => {
  await writeAudit(req, 'auth.oauth.google.initiated', 'auth', null, {
    provider: 'google',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  await oauthService.reconfigureStrategies();

  const options = { session: false, scope: ['profile', 'email'] };
  if (req.query.redirect || req.query.ref) {
    options.state = Buffer.from(JSON.stringify({ redirect: req.query.redirect, ref: req.query.ref })).toString('base64');
  }

  passport.authenticate('google', options)(req, res, next);
};

exports.authenticateGoogle = async (req, res, next) => {
  await oauthService.reconfigureStrategies();
  passport.authenticate('google', { session: false, failureRedirect: `${getFrontendBase()}/login?error=oauth_failed` })(req, res, next);
};

exports.callbackGoogle = async (req, res, _next) => {
  const frontendBase = getFrontendBase();
  try {
    if (!req.user) {
      await writeAudit(req, 'auth.oauth.google.failed', 'auth', null, {
        provider: 'google',
        reason: 'no_user_returned',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      await logUserActivity(req, 'auth.login.failed', { reason: 'oauth_failed', provider: 'google' });
      return res.redirect(`${frontendBase}/login?error=oauth_failed`);
    }

    const result = await oauthService.handleOAuthSuccess(req, 'google');
    const callbackUrl = new URL(`${frontendBase}/auth/callback`);

    const safeRedirect = extractSafeRedirect(req.query.state || (req.user && req.user._state));
    if (safeRedirect) {
      callbackUrl.searchParams.set('redirect', safeRedirect);
    }

    if (result.requires2FA) {
      const twoFaUrl = new URL(`${frontendBase}/2fa`);
      twoFaUrl.searchParams.set('temp_token', result.tempToken);
      if (safeRedirect) {
        twoFaUrl.searchParams.set('redirect', safeRedirect);
      }
      return res.redirect(twoFaUrl.toString());
    }

    callbackUrl.searchParams.set('token', result.token);

    return res.redirect(callbackUrl.toString());
  } catch (error) {
    if (error && error.code === 'ERR_ACCOUNT_BANNED') {
      return res.redirect(`${frontendBase}/login?error=ERR_ACCOUNT_BANNED`);
    }
    await writeAudit(req, 'auth.oauth.google.error', 'auth', null, {
      provider: 'google',
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }).catch(() => {});
    return res.redirect(`${frontendBase}/login?error=oauth_failed`);
  }
};
