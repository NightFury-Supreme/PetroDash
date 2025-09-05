const axios = require('axios');

/**
 * Discord API service for managing server memberships
 */
class DiscordService {
  /**
   * Add a user to a Discord server using their OAuth2 access token
   * @param {string} userId - Discord user ID
   * @param {string} accessToken - User's OAuth2 access token
   * @param {string} botToken - Bot token for authorization
   * @param {string} guildId - Discord server (guild) ID
   * @param {Array} roles - Optional array of role IDs to assign
   * @returns {Promise<Object>} Discord API response
   */
  static async addUserToServer(userId, accessToken, botToken, guildId, roles = []) {
    try {
      const response = await axios.put(
        `https://discord.com/api/guilds/${guildId}/members/${userId}`,
        {
          access_token: accessToken,
          ...(roles.length > 0 && { roles })
        },
        {
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return { success: true, data: response.data };
    } catch (error) {
      // Handle specific Discord API errors
      if (error.response) {
        const { status, data } = error.response;
        
        // User already in server
        if (status === 204) {
          return { success: true, message: 'User already in server' };
        }
        
        // Invalid access token or other API errors
        return { 
          success: false, 
          error: data.message || 'Discord API error',
          code: data.code,
          status 
        };
      }
      
      return { 
        success: false, 
        error: 'Network error connecting to Discord API' 
      };
    }
  }

  /**
   * Get user's Discord guilds (servers they're in)
   * @param {string} accessToken - User's OAuth2 access token
   * @returns {Promise<Array>} Array of guilds
   */
  static async getUserGuilds(accessToken) {
    try {
      const response = await axios.get('https://discord.com/api/users/@me/guilds', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return { success: true, guilds: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch user guilds' 
      };
    }
  }

  /**
   * Check if user is already in the specified server
   * @param {string} userId - Discord user ID
   * @param {string} accessToken - User's OAuth2 access token
   * @param {string} guildId - Discord server (guild) ID
   * @returns {Promise<boolean>} True if user is in server
   */
  static async isUserInServer(userId, accessToken, guildId) {
    try {
      const result = await this.getUserGuilds(accessToken);
      if (!result.success) return false;
      
      return result.guilds.some(guild => guild.id === guildId);
    } catch (error) {
      return false;
    }
  }
}

module.exports = DiscordService;
