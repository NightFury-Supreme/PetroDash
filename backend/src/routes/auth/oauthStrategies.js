/**
 * OAuth Passport Strategies Configuration
 */

const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../../models/User');
const { getSettings } = require('../../lib/settings');
const UserCreationService = require('../../services/userCreation');

async function resolveOAuthUsername(preferred) {
  let base = String(preferred || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 20);
  if (base.length < 3) base = `user_${base}`;

  let candidate = base;
  let counter = 1;
  while (await User.exists({ username: candidate })) {
    const rand = Math.floor(100 + Math.random() * 900);
    candidate = `${base.slice(0, 24)}_${rand}`;
    counter++;
    if (counter > 10) break;
  }
  return candidate;
}

const configurePassport = async () => {
  const settings = await getSettings();
  if (!settings) return;

  // Discord Strategy
  if (settings.auth?.discord?.enabled && settings.auth.discord.clientId) {
    const discordRedirectUri = settings.auth.discord.redirectUri || `${process.env.FRONTEND_URL?.replace('dashboard', 'api') || process.env.API_BASE_URL || 'http://localhost:4000'}/api/oauth/discord/callback`;

    passport.unuse('discord');

    passport.use('discord', new DiscordStrategy({
      clientID: settings.auth.discord.clientId,
      clientSecret: settings.auth.discord.clientSecret,
      callbackURL: discordRedirectUri,
      scope: ['identify', 'email', 'guilds.join'],
      passReqToCallback: true,
    }, async (req, accessToken, refreshToken, profile, done) => {
      try {
        let ref;
        if (req.query.state) {
          try {
            const stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
            ref = stateData.ref;
          } catch {}
        }

        let user = await User.findOne({ 'oauthProviders.discord.id': { $eq: String(profile.id) } });

        if (user) {
          user.oauthProviders.discord.accessToken = accessToken;
          await user.save();
          return done(null, user);
        }

        user = await User.findOne({ email: { $eq: String(profile.email) } });

        if (user) {
          await UserCreationService.linkOAuthProvider(user, {
            provider: 'discord',
            data: {
              id: profile.id,
              username: profile.username,
              discriminator: profile.discriminator,
              avatar: profile.avatar,
              accessToken: accessToken,
            },
          });
          return done(null, user);
        }

        const username = await resolveOAuthUsername(profile.username);
        const [firstName, ...lastNameParts] = (profile.global_name || profile.username).split(' ');
        const lastName = lastNameParts.join(' ') || 'User';

        user = await UserCreationService.createUser({
          email: profile.email,
          username,
          firstName,
          lastName,
          ref,
          oauthProviders: {
            discord: {
              id: profile.id,
              username: profile.username,
              discriminator: profile.discriminator,
              avatar: profile.avatar,
              accessToken,
            },
          },
        });

        await UserCreationService.grantReferralRewards(user);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // Google Strategy
  if (settings.auth?.google?.enabled && settings.auth.google.clientId) {
    const googleRedirectUri = settings.auth.google.redirectUri || `${process.env.FRONTEND_URL?.replace('dashboard', 'api') || process.env.API_BASE_URL || 'http://localhost:4000'}/api/oauth/google/callback`;

    passport.unuse('google');

    passport.use('google', new GoogleStrategy({
      clientID: settings.auth.google.clientId,
      clientSecret: settings.auth.google.clientSecret,
      callbackURL: googleRedirectUri,
      passReqToCallback: true,
    }, async (req, accessToken, refreshToken, profile, done) => {
      try {
        let ref;
        if (req.query.state) {
          try {
            const stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
            ref = stateData.ref;
          } catch {}
        }

        let user = await User.findOne({ 'oauthProviders.google.id': { $eq: String(profile.id) } });

        if (user) {
          user.oauthProviders.google.accessToken = accessToken;
          await user.save();
          return done(null, user);
        }

        user = await User.findOne({ email: { $eq: String(profile.emails[0].value) } });

        if (user) {
          await UserCreationService.linkOAuthProvider(user, {
            provider: 'google',
            data: {
              id: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              picture: profile.photos[0]?.value,
              accessToken,
            },
          });
          return done(null, user);
        }

        const [firstName, ...lastNameParts] = profile.displayName.split(' ');
        const lastName = lastNameParts.join(' ') || 'User';
        const username = await resolveOAuthUsername(profile.emails[0].value.split('@')[0]);

        user = await UserCreationService.createUser({
          email: profile.emails[0].value,
          username,
          firstName,
          lastName,
          ref,
          oauthProviders: {
            google: {
              id: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              picture: profile.photos[0]?.value,
              accessToken,
            },
          },
        });

        await UserCreationService.grantReferralRewards(user);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }
};

const reconfigureStrategies = async () => {
  try {
    await configurePassport();
  } catch {}
};

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

module.exports = {
  configurePassport,
  reconfigureStrategies,
};
