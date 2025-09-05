const axios = require('axios');

/**
 * Google API service for managing user data and integrations
 */
class GoogleService {
  /**
   * Get user's Google profile information
   * @param {string} accessToken - User's OAuth2 access token
   * @returns {Promise<Object>} Google profile data
   */
  static async getUserProfile(accessToken) {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return { success: true, profile: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to fetch Google profile' 
      };
    }
  }

  /**
   * Get user's Google account information
   * @param {string} accessToken - User's OAuth2 access token
   * @returns {Promise<Object>} Google account data
   */
  static async getAccountInfo(accessToken) {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return { success: true, account: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to fetch Google account info' 
      };
    }
  }

  /**
   * Verify Google access token
   * @param {string} accessToken - User's OAuth2 access token
   * @returns {Promise<Object>} Token verification result
   */
  static async verifyToken(accessToken) {
    try {
      const response = await axios.get(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
      
      return { success: true, tokenInfo: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Invalid or expired token' 
      };
    }
  }

  /**
   * Get user's Google Drive information (if scope is granted)
   * @param {string} accessToken - User's OAuth2 access token
   * @returns {Promise<Object>} Google Drive data
   */
  static async getDriveInfo(accessToken) {
    try {
      const response = await axios.get('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return { success: true, driveInfo: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to fetch Google Drive info' 
      };
    }
  }

  /**
   * Get user's Gmail profile (if scope is granted)
   * @param {string} accessToken - User's OAuth2 access token
   * @returns {Promise<Object>} Gmail profile data
   */
  static async getGmailProfile(accessToken) {
    try {
      const response = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return { success: true, gmailProfile: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Failed to fetch Gmail profile' 
      };
    }
  }

  /**
   * Revoke Google access token
   * @param {string} accessToken - User's OAuth2 access token
   * @returns {Promise<Object>} Revocation result
   */
  static async revokeToken(accessToken) {
    try {
      await axios.post(`https://oauth2.googleapis.com/revoke?token=${accessToken}`);
      
      return { success: true, message: 'Token revoked successfully' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to revoke token' 
      };
    }
  }
}

module.exports = GoogleService;
