const User = require('../models/User');
const DefaultResources = require('../models/DefaultResources');
const Settings = require('../models/Settings');
const { createPanelUser, checkUserExists } = require('./pterodactyl');
const bcrypt = require('bcryptjs');

/**
 * Unified user creation service for both normal registration and OAuth
 */
class UserCreationService {
  /**
   * Create a new user with all necessary setup
   * @param {Object} userData - User data
   * @param {string} userData.email - User email
   * @param {string} userData.username - Username
   * @param {string} userData.firstName - First name
   * @param {string} userData.lastName - Last name
   * @param {string} [userData.password] - Password (optional for OAuth)
   * @param {string} [userData.ref] - Referral code
   * @param {Object} [userData.oauthProviders] - OAuth provider data
   * @returns {Promise<Object>} Created user and JWT token
   */
  static async createUser(userData) {
    const { email, username, firstName, lastName, password, ref, oauthProviders } = userData;

    // Check for existing users in database
    const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (existing) {
      throw new Error('Email or username already in use');
    }

    // Check Pterodactyl panel for existing users
    const pterodactylCheck = await checkUserExists(email, username);
    if (pterodactylCheck.emailExists) {
      throw new Error('Email already exists in Pterodactyl panel');
    }
    if (pterodactylCheck.usernameExists) {
      throw new Error('Username already exists in Pterodactyl panel');
    }

    // Get default resources
    const defaults = await DefaultResources.findOne({}).lean();

    // Hash password if provided (for normal registration)
    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;

    // Create user in database
    const user = await User.create({
      email,
      username,
      firstName,
      lastName,
      passwordHash,
      oauthProviders: oauthProviders || {},
      coins: Number(defaults?.coins || 0),
      resources: {
        diskMb: Number(defaults?.diskMb ?? 5120),
        memoryMb: Number(defaults?.memoryMb ?? 2048),
        cpuPercent: Number(defaults?.cpuPercent ?? 80),
        backups: Number(defaults?.backups ?? 0),
        databases: Number(defaults?.databases ?? 0),
        allocations: Number(defaults?.allocations ?? 0),
        serverSlots: Number(defaults?.serverSlots ?? 1),
      },
    });

    // Handle referral attribution and rewards
    await this.handleReferralRewards(user, ref);

    // Create Pterodactyl user
    await this.createPterodactylUser(user, password);

    return user;
  }

  /**
   * Link OAuth provider to existing user
   * @param {Object} user - Existing user
   * @param {Object} oauthData - OAuth provider data
   * @param {string} oauthData.provider - Provider name (discord/google)
   * @param {Object} oauthData.data - Provider-specific data
   */
  static async linkOAuthProvider(user, oauthData) {
    const { provider, data } = oauthData;
    
    // Update OAuth providers
    user.oauthProviders = user.oauthProviders || {};
    user.oauthProviders[provider] = data;
    await user.save();

    // Create Pterodactyl user if they don't have one
    if (!user.pterodactylUserId) {
      await this.createPterodactylUser(user);
    }
  }

  /**
   * Handle referral rewards for new users
   * @param {Object} user - User object
   * @param {string} ref - Referral code
   */
  static async handleReferralRewards(user, ref) {
    if (!ref || typeof ref !== 'string') return;

    try {
      const referrer = await User.findOne({ referralCode: ref.trim().toUpperCase() });
      if (!referrer || String(referrer._id) === String(user._id)) return;

      // Load settings for coin rewards
      const settings = await Settings.findOne({}).lean();
      const referrerCoins = Number(settings?.referrals?.referrerCoins ?? Number(process.env.REFERRAL_REWARD_COINS || 50));
      const referredCoins = Number(settings?.referrals?.referredCoins ?? Number(process.env.REFERRAL_REFERRED_COINS || 25));

      // Set referral relationship
      user.referredBy = referrer._id;
      await user.save();

      // Update referrer stats and coins
      referrer.referralStats = referrer.referralStats || { referredCount: 0, coinsEarned: 0 };
      referrer.referralStats.referredCount = Number(referrer.referralStats.referredCount || 0) + 1;
      referrer.referralStats.coinsEarned = Number(referrer.referralStats.coinsEarned || 0) + referrerCoins;
      referrer.coins = Number(referrer.coins || 0) + referrerCoins;
      await referrer.save();

      // Award referred user coins
      user.coins = Number(user.coins || 0) + referredCoins;
      await user.save();
    } catch (error) {
      console.error('Failed to handle referral rewards:', error);
    }
  }

  /**
   * Create Pterodactyl user
   * @param {Object} user - User object
   * @param {string} [password] - Password (optional, will generate temp password if not provided)
   */
  static async createPterodactylUser(user, password) {
    try {
      // Generate temporary password if not provided (for OAuth users)
      const crypto = require('crypto');
      const panelPassword = password || crypto.randomBytes(8).toString('hex') + 'A1!';
      
      const panelUser = await createPanelUser({
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        password: panelPassword
      });
      
      if (panelUser?.id) {
        user.pterodactylUserId = panelUser.id;
        await user.save();
      }
    } catch (error) {
      console.error('Failed to create Pterodactyl user:', error);
      // Don't throw error - user creation should succeed even if Pterodactyl fails
    }
  }

  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  static generateJwt(user) {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { sub: user._id.toString(), email: user.email, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Format user response
   * @param {Object} user - User object
   * @returns {Object} Formatted user data
   */
  static formatUserResponse(user) {
    return {
      id: user._id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      coins: Number(user.coins || 0),
      pterodactylUserId: user.pterodactylUserId || null,
      resources: user.resources
    };
  }
}

module.exports = UserCreationService;
