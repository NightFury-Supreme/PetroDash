const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = require('../../models/User');
const { getSettings } = require('../../lib/settings');
const { sendMailTemplate } = require('../../lib/mail');
const UserCreationService = require('../../services/userCreation');
const { writeAudit } = require('../../middleware/audit');
const { logUserActivity } = require('../../middleware/userActivity');
const { generateUniqueUsername } = require('./auth.helpers');

function extractRefFromState(req) {
  if (!req.query.state) return undefined;
  try {
    const stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
    if (typeof stateData.ref === 'string') {
      const clean = stateData.ref.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '').slice(0, 32);
      return clean || undefined;
    }
    return undefined;
  } catch (_stateErr) {
    return undefined;
  }
}

const configurePassport = async () => {
  const settings = await getSettings();
  if (!settings) return;

  if (settings.auth?.discord?.enabled && settings.auth.discord.clientId) {
    const discordRedirectUri = settings.auth.discord.redirectUri || `${process.env.FRONTEND_URL}/api/oauth/discord/callback`;
    passport.unuse('discord');

    passport.use('discord', new DiscordStrategy({
      clientID: settings.auth.discord.clientId,
      clientSecret: settings.auth.discord.clientSecret,
      callbackURL: discordRedirectUri,
      scope: ['identify', 'email', 'guilds.join'],
      passReqToCallback: true,
    }, async (req, accessToken, _refreshToken, profile, done) => {
      try {
        req.oauthAccessToken = accessToken;
        const ref = extractRefFromState(req);

        let user = await User.findOne({ 'oauthProviders.discord.id': { $eq: String(profile.id) } });
        if (user) {
          if (user.oauthProviders?.discord) {
            user.oauthProviders.discord.avatar = profile.avatar;
            user.oauthProviders.discord.username = profile.username;
            user.oauthProviders.discord.discriminator = profile.discriminator;
            await user.save();
          }
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
            },
          });
          await writeAudit(req, 'auth.oauth.linked', 'auth', user.publicId, { provider: 'discord', userId: user.publicId });
          await logUserActivity(req, 'auth.oauth.linked', { provider: 'discord' }, user.publicId);
          return done(null, user);
        }

        const rawUsername = profile.username + (profile.discriminator && profile.discriminator !== '0' ? `#${profile.discriminator}` : '');
        const username = await generateUniqueUsername(rawUsername);
        const [firstName, ...lastNameParts] = (profile.global_name || profile.username).split(' ');
        const lastName = lastNameParts.join(' ') || firstName;

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
            },
          },
        });

        await UserCreationService.grantReferralRewards(user);
        await sendMailTemplate({
          to: user.email,
          templateKey: 'accountCreated',
          data: { username: user.username, email: user.email },
        }).catch((err) => {
          writeAudit(req, 'auth.email.send_failed', 'auth', user.publicId, {
            template: 'accountCreated',
            error: err.message,
          }).catch(() => {});
        });
        await writeAudit(req, 'auth.register.success', 'auth', user.publicId, {
          registrationMethod: 'discord',
          email: user.email,
          username: user.username,
          userId: user.publicId,
          referralCode: ref || null,
        });
        await logUserActivity(req, 'auth.register.success', { registrationMethod: 'discord' }, user.publicId);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  if (settings.auth?.google?.enabled && settings.auth.google.clientId) {
    const googleRedirectUri = settings.auth.google.redirectUri || `${process.env.FRONTEND_URL}/api/oauth/google/callback`;
    passport.unuse('google');

    passport.use('google', new GoogleStrategy({
      clientID: settings.auth.google.clientId,
      clientSecret: settings.auth.google.clientSecret,
      callbackURL: googleRedirectUri,
      passReqToCallback: true,
    }, async (req, accessToken, _refreshToken, profile, done) => {
      try {
        const ref = extractRefFromState(req);

        let user = await User.findOne({ 'oauthProviders.google.id': { $eq: String(profile.id) } });
        if (user) {
          if (user.oauthProviders?.google) {
            user.oauthProviders.google.picture = profile.photos[0]?.value;
            user.oauthProviders.google.name = profile.displayName;
            await user.save();
          }
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
            },
          });
          await writeAudit(req, 'auth.oauth.linked', 'auth', user.publicId, { provider: 'google', userId: user.publicId });
          await logUserActivity(req, 'auth.oauth.linked', { provider: 'google' }, user.publicId);
          return done(null, user);
        }

        const [firstName, ...lastNameParts] = profile.displayName.split(' ');
        const lastName = lastNameParts.join(' ') || firstName;
        const baseName = profile.emails[0].value.split('@')[0];
        const username = await generateUniqueUsername(baseName);

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
            },
          },
        });

        await UserCreationService.grantReferralRewards(user);
        await sendMailTemplate({
          to: user.email,
          templateKey: 'accountCreated',
          data: { username: user.username, email: user.email },
        }).catch((err) => {
          writeAudit(req, 'auth.email.send_failed', 'auth', user.publicId, {
            template: 'accountCreated',
            error: err.message,
          }).catch(() => {});
        });
        await writeAudit(req, 'auth.register.success', 'auth', user.publicId, {
          registrationMethod: 'google',
          email: user.email,
          username: user.username,
          userId: user.publicId,
          referralCode: ref || null,
        });
        await logUserActivity(req, 'auth.register.success', { registrationMethod: 'google' }, user.publicId);
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
  } catch (_configErr) {}
};

module.exports = {
  configurePassport,
  reconfigureStrategies,
};

