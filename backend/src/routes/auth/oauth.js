const express = require('express');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../../models/User');
const Settings = require('../../models/Settings');
const UserCreationService = require('../../services/userCreation');
const DiscordService = require('../../services/discord');
const GoogleService = require('../../services/google');
const { writeAudit } = require('../../middleware/audit');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { sendMailTemplate } = require('../../lib/mail');

// Configure Passport strategies
const configurePassport = async () => {
  const settings = await Settings.findOne();
  if (!settings) return;

  // Discord Strategy
  if (settings.auth?.discord?.enabled && settings.auth.discord.clientId) {
    const discordRedirectUri = settings.auth.discord.redirectUri || `${process.env.FRONTEND_URL?.replace('dashboard', 'api') || process.env.API_BASE_URL || 'http://localhost:4000'}/api/oauth/discord/callback`;
    
    // Remove existing strategy if it exists
    passport.unuse('discord');
    
    passport.use('discord', new DiscordStrategy({
      clientID: settings.auth.discord.clientId,
      clientSecret: settings.auth.discord.clientSecret,
      callbackURL: discordRedirectUri,
      scope: ['identify', 'email', 'guilds.join']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this Discord ID
        let user = await User.findOne({ 'oauthProviders.discord.id': profile.id });
        
        if (user) {
          // Store access token for potential server joining
          user.oauthProviders.discord.accessToken = accessToken;
          await user.save();
          return done(null, user);
        }

        // Check if user exists with this email
        user = await User.findOne({ email: profile.email });
        
        if (user) {
          // Link Discord account to existing user using unified service
          await UserCreationService.linkOAuthProvider(user, {
            provider: 'discord',
            data: {
              id: profile.id,
              username: profile.username,
              discriminator: profile.discriminator,
              avatar: profile.avatar,
              accessToken: accessToken
            }
          });
          return done(null, user);
        }

        // Create new user using unified service
        const username = profile.username + (profile.discriminator !== '0' ? `#${profile.discriminator}` : '');
        const [firstName, ...lastNameParts] = (profile.global_name || profile.username).split(' ');
        const lastName = lastNameParts.join(' ') || '';

        user = await UserCreationService.createUser({
          email: profile.email,
          username: username,
          firstName: firstName,
          lastName: lastName,
          oauthProviders: {
            discord: {
              id: profile.id,
              username: profile.username,
              discriminator: profile.discriminator,
              avatar: profile.avatar,
              accessToken: accessToken
            }
          }
        });

        return done(null, user);
      } catch (error) {
        // OAuth strategy error logged silently
        return done(error, null);
      }
    }));
  }

  // Google Strategy
  if (settings.auth?.google?.enabled && settings.auth.google.clientId) {
    const googleRedirectUri = settings.auth.google.redirectUri || `${process.env.FRONTEND_URL?.replace('dashboard', 'api') || process.env.API_BASE_URL || 'http://localhost:4000'}/api/oauth/google/callback`;
    
    // Remove existing strategy if it exists
    passport.unuse('google');
    
    passport.use('google', new GoogleStrategy({
      clientID: settings.auth.google.clientId,
      clientSecret: settings.auth.google.clientSecret,
      callbackURL: googleRedirectUri
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this Google ID
        let user = await User.findOne({ 'oauthProviders.google.id': profile.id });
        
        if (user) {
          // Store access token for potential Google API calls
          user.oauthProviders.google.accessToken = accessToken;
          await user.save();
          return done(null, user);
        }

        // Check if user exists with this email
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Link Google account to existing user using unified service
          await UserCreationService.linkOAuthProvider(user, {
            provider: 'google',
            data: {
              id: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              picture: profile.photos[0]?.value,
              accessToken: accessToken
            }
          });
          return done(null, user);
        }

        // Create new user using unified service
        const [firstName, ...lastNameParts] = profile.displayName.split(' ');
        const lastName = lastNameParts.join(' ') || '';
        const username = profile.emails[0].value.split('@')[0];

        user = await UserCreationService.createUser({
          email: profile.emails[0].value,
          username: username,
          firstName: firstName,
          lastName: lastName,
          oauthProviders: {
            google: {
              id: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              picture: profile.photos[0]?.value,
              accessToken: accessToken
            }
          }
        });

        return done(null, user);
      } catch (error) {
        // OAuth strategy error logged silently
        return done(error, null);
      }
    }));
  }
};

// Function to reconfigure strategies (called when settings are updated)
const reconfigureStrategies = async () => {
  try {
    await configurePassport();
  } catch (error) {
    // OAuth reconfiguration error logged silently
  }
};

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// OAuth routes
router.get('/discord', async (req, res, next) => {
  // Log Discord OAuth initiation
  await writeAudit(req, 'auth.oauth.discord.initiated', 'auth', null, {
    provider: 'discord',
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Ensure strategies are configured before use
  await reconfigureStrategies();
  passport.authenticate('discord')(req, res, next);
});

router.get('/discord/callback', async (req, res, next) => {
  // Ensure strategies are configured before use
  await reconfigureStrategies();
  passport.authenticate('discord', { failureRedirect: '/login?error=oauth_failed' })(req, res, next);
}, async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.user) {
      await writeAudit(req, 'auth.oauth.discord.failed', 'auth', null, {
        provider: 'discord',
        reason: 'no_user_returned',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        durationMs: Date.now() - startTime
      });
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
    
    const token = UserCreationService.generateJwt(req.user);
    
    // If user email not yet verified, mark as verified=true (OAuth providers supply verified emails)
    try {
      if (!req.user.emailVerified) {
        req.user.emailVerified = true;
        await req.user.save();
      }
    } catch {}
    
    // Check if Discord server auto-join is configured and enabled
    const settings = await Settings.findOne();
    const autoJoinEnabled = settings?.auth?.discord?.autoJoin;
    const botToken = settings?.auth?.discord?.botToken;
    const guildId = settings?.auth?.discord?.guildId;
    const accessToken = req.user.oauthProviders?.discord?.accessToken;
    
    let joinResult = null;
    
    // Try to add user to Discord server if auto-join is enabled and configured
    if (autoJoinEnabled && botToken && guildId && accessToken && req.user.oauthProviders?.discord?.id) {
      try {
        joinResult = await DiscordService.addUserToServer(
          req.user.oauthProviders.discord.id,
          accessToken,
          botToken,
          guildId
        );
      } catch (error) {
        // Discord server join error logged silently
      }
    }
    
    // Log successful Discord OAuth
    await writeAudit(req, 'auth.oauth.discord.success', 'auth', req.user._id.toString(), {
      provider: 'discord',
      loginMethod: 'discord',
      userId: req.user._id.toString(),
      username: req.user.username,
      email: req.user.email,
      discordId: req.user.oauthProviders?.discord?.id,
      discordUsername: req.user.oauthProviders?.discord?.username,
      autoJoinEnabled,
      discordJoinResult: joinResult ? (joinResult.success ? 'success' : 'failed') : 'not_attempted',
      discordJoinError: joinResult && !joinResult.success ? joinResult.error : null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime
    });
    
    // Send login alert email (best-effort)
    try {
      if (req.user?.email) {
        await sendMailTemplate({
          to: req.user.email,
          templateKey: 'loginAlert',
          data: {
            username: req.user.username,
            ip: req.ip,
            userAgent: req.get('User-Agent') || 'Unknown',
            time: new Date().toLocaleString(),
            serverName: process.env.SERVER_NAME || 'Dashboard',
            title: 'New login to your account',
            snippet: 'You signed in with Discord OAuth',
            reason: 'OAuth login (Discord)'
          }
        });
      }
    } catch (e) {
      // Email error logged silently for production
    }
    
    // Redirect to callback with join result
    const callbackUrl = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
    callbackUrl.searchParams.set('token', token);
    
    if (joinResult) {
      callbackUrl.searchParams.set('discord_join', joinResult.success ? 'success' : 'failed');
      if (!joinResult.success) {
        callbackUrl.searchParams.set('discord_error', joinResult.error || 'Unknown error');
      }
    }
    
    res.redirect(callbackUrl.toString());
  } catch (error) {
    // OAuth error logged silently for production
    await writeAudit(req, 'auth.oauth.discord.error', 'auth', req.user?._id?.toString() || null, {
      provider: 'discord',
      reason: 'server_error',
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime
    });
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

router.get('/google', async (req, res, next) => {
  // Log Google OAuth initiation
  await writeAudit(req, 'auth.oauth.google.initiated', 'auth', null, {
    provider: 'google',
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Ensure strategies are configured before use
  await reconfigureStrategies();
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', async (req, res, next) => {
  // Ensure strategies are configured before use
  await reconfigureStrategies();
  passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' })(req, res, next);
}, async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.user) {
      await writeAudit(req, 'auth.oauth.google.failed', 'auth', null, {
        provider: 'google',
        reason: 'no_user_returned',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        durationMs: Date.now() - startTime
      });
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
    
    const token = UserCreationService.generateJwt(req.user);
    
    // If user email not yet verified, mark as verified=true (OAuth providers supply verified emails)
    try {
      if (!req.user.emailVerified) {
        req.user.emailVerified = true;
        await req.user.save();
      }
    } catch {}
    
    // Log successful Google OAuth
    await writeAudit(req, 'auth.oauth.google.success', 'auth', req.user._id.toString(), {
      provider: 'google',
      loginMethod: 'google',
      userId: req.user._id.toString(),
      username: req.user.username,
      email: req.user.email,
      googleId: req.user.oauthProviders?.google?.id,
      googleEmail: req.user.oauthProviders?.google?.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime
    });
    
    // Send login alert email (best-effort)
    try {
      if (req.user?.email) {
        await sendMailTemplate({
          to: req.user.email,
          templateKey: 'loginAlert',
          data: {
            username: req.user.username,
            ip: req.ip,
            userAgent: req.get('User-Agent') || 'Unknown',
            time: new Date().toLocaleString(),
            serverName: process.env.SERVER_NAME || 'Dashboard',
            title: 'New login to your account',
            snippet: 'You signed in with Google OAuth',
            reason: 'OAuth login (Google)'
          }
        });
      }
    } catch (e) {
      // Email error logged silently for production
    }
    
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    // OAuth error logged silently for production
    await writeAudit(req, 'auth.oauth.google.error', 'auth', req.user?._id?.toString() || null, {
      provider: 'google',
      reason: 'server_error',
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime
    });
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

// Get OAuth status
router.get('/status', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      return res.json({ discord: false, google: false });
    }

    res.json({
      discord: {
        enabled: settings.auth?.discord?.enabled || false,
        clientId: settings.auth?.discord?.clientId || ''
      },
      google: {
        enabled: settings.auth?.google?.enabled || false,
        clientId: settings.auth?.google?.clientId || ''
      }
    });
  } catch (error) {
    // OAuth status error logged silently
    res.status(500).json({ error: 'Failed to get OAuth status' });
  }
});

// Reconfigure strategies (for admin use)
router.post('/reconfigure', async (req, res) => {
  try {
    await reconfigureStrategies();
    res.json({ success: true, message: 'OAuth strategies reconfigured' });
  } catch (error) {
    // OAuth reconfiguration error logged silently
    res.status(500).json({ error: 'Failed to reconfigure OAuth strategies' });
  }
});

// Create Pterodactyl user for existing user (for fixing missing pterodactylUserId)
router.post('/create-pterodactyl-user', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.pterodactylUserId) {
      return res.status(400).json({ error: 'User already has Pterodactyl account' });
    }

    // Create Pterodactyl user
    await UserCreationService.createPterodactylUser(user);
    
    // Refresh user data
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Pterodactyl user created successfully',
      pterodactylUserId: user.pterodactylUserId 
    });
  } catch (error) {
    // Pterodactyl user creation error logged silently
    res.status(500).json({ error: 'Failed to create Pterodactyl user' });
  }
});

module.exports = { router, reconfigureStrategies };
