const axios = require('axios');

class DiscordService {
  static async addUserToServer(userId, accessToken, botToken, guildId, roles = []) {
    try {
      const response = await axios.put(
        `https://discord.com/api/guilds/${guildId}/members/${userId}`,
        {
          access_token: accessToken,
          ...(roles.length > 0 && { roles }),
        },
        {
          headers: {
            Authorization: `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;

        if (status === 204) {
          return { success: true, message: 'User already in server' };
        }

        return {
          success: false,
          error: data.message || 'Discord API error',
          code: data.code,
          status,
        };
      }

      return {
        success: false,
        error: 'Network error connecting to Discord API',
      };
    }
  }
}

module.exports = DiscordService;
