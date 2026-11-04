const User = require('../../models/User');
const Server = require('../../models/Server');
const { calculateUserTotalResources } = require('../../utils/resourceCalculator');
const UserCreationService = require('../../services/userCreation');
const SessionService = require('../../services/SessionService');
const { getSettings } = require('../../lib/settings');
const { sendMailTemplate } = require('../../lib/mail');
const { getOrSetCache, deleteCache } = require('../../lib/redis');
const { invalidateUserCaches } = require('../../utils/userCacheInvalidation');
const { writeAudit } = require('../../middleware/audit');
const { logUserActivity } = require('../../middleware/userActivity');
const { buildIdFilter } = require('../../utils/publicId');
const AppError = require('../../utils/AppError');

async function register(req, { email, username, firstName, lastName, password, ref }) {
  const startTime = Date.now();
  let user = null;

  try {
    const s = await getSettings();
    const emailLoginEnabled = s?.auth?.emailLogin ?? true;
    if (!emailLoginEnabled) {
      await writeAudit(req, 'auth.register.failed', 'auth', null, {
        reason: 'email_login_disabled',
        email,
        username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      throw AppError.forbidden('Email registration is disabled', 'ERR_REGISTRATION_DISABLED');
    }

    user = await UserCreationService.createUser({ email, username, firstName, lastName, password, ref });
    const avatarService = require('../../services/avatarService');
    await avatarService.ensureUserAvatarOnCdn(user).catch(() => {});
    const { token } = await SessionService.createSessionAndJwt(user, req);
    const userResponse = UserCreationService.formatUserResponse(user);

    const emailVerificationEnabled = s?.auth?.emailVerification ?? false;
    if (!emailVerificationEnabled) {
      await UserCreationService.grantReferralRewards(user).catch(() => {});
    }

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
      registrationMethod: 'email',
      email,
      firstName,
      lastName,
      userId: user.publicId,
      referralCode: ref || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime,
    });
    await logUserActivity(req, 'auth.register.success', {
      registrationMethod: 'email',
      ...(ref ? { referralCodeUsed: ref } : {}),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }, user.publicId);
    await invalidateUserCaches(user.publicId);

    return { token, user: userResponse, requiresVerification: Boolean(emailVerificationEnabled) };
  } catch (error) {
    const isUserExists = Boolean(error.message?.includes('already in use') || error.message?.includes('already exists') || error.code === 11000);
    await writeAudit(req, 'auth.register.failed', 'auth', user?.publicId || null, {
      reason: isUserExists ? 'user_exists' : 'server_error',
      error: isUserExists ? 'ERR_USER_EXISTS' : 'ERR_INTERNAL_SERVER',
      email,
      username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      durationMs: Date.now() - startTime,
    });

    if (error instanceof AppError) throw error;
    if (isUserExists) {
      throw AppError.conflict('Username or email already in use', 'ERR_USER_EXISTS');
    }
    throw AppError.internal('Internal server error', 'ERR_INTERNAL_SERVER');
  }
}

async function getMe(req) {
  const cacheKey = `user:${req.user.sub}:profile`;
  return getOrSetCache(cacheKey, async () => {
    const user = await User.findOne(buildIdFilter(req.user.sub)).select('+passwordHash').lean();
    if (!user) throw AppError.notFound('User not found', 'ERR_USER_NOT_FOUND');

    const ban = user.ban || {};
    const activeBan = Boolean(ban.isBanned) && (!ban.until || new Date(ban.until) > new Date());
    if (activeBan) {
      throw AppError.forbidden('Account banned', 'ERR_ACCOUNT_BANNED', {
        reason: ban.reason || '',
        until: ban.until || null,
        username: user.username || '',
      });
    }

    const serverCount = await Server.countDocuments({ owner: user._id });
    const hasPassword = Boolean(user.passwordHash);
    const loginMethod = hasPassword
      ? 'email'
      : user.oauthProviders?.discord?.id
      ? 'discord'
      : user.oauthProviders?.google?.id
      ? 'google'
      : 'email';

    const avatarService = require('../../services/avatarService');
    const profilePicture = await avatarService.ensureUserAvatarOnCdn(user);

    const oauthProviders = {};
    if (user.oauthProviders?.discord?.id) {
      oauthProviders.discord = {
        id: user.oauthProviders.discord.id,
        username: user.oauthProviders.discord.username,
        discriminator: user.oauthProviders.discord.discriminator,
        avatar: user.oauthProviders.discord.avatar,
      };
    }
    if (user.oauthProviders?.google?.id) {
      oauthProviders.google = {
        id: user.oauthProviders.google.id,
        name: user.oauthProviders.google.name,
        email: user.oauthProviders.google.email,
        picture: user.oauthProviders.google.picture,
      };
    }

    const { totalResources, activePlans } = await calculateUserTotalResources(user);
    const publicId = user.publicId;

    return {
      id: publicId,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      coins: Number(user.coins || 0),
      pterodactylUserId: user.pterodactylUserId || null,
      resources: totalResources,
      baseResources: user.resources,
      serverCount: Number(serverCount || 0),
      loginMethod,
      profilePicture,
      oauthProviders,
      emailVerified: Boolean(user.emailVerified),
      tfaEnabled: Boolean(user.tfaEnabled),
      hasActivePlans: activePlans.length > 0,
    };
  }, 30);
}

const authAvatarService = require('./auth.avatar.service');

module.exports = {
  register,
  getMe,
  uploadProfilePicture: authAvatarService.uploadProfilePicture,
  syncOAuthAvatar: authAvatarService.syncOAuthAvatar,
  resetProfilePicture: authAvatarService.resetProfilePicture,
};
