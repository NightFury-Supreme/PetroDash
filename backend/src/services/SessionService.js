const jwt = require('jsonwebtoken');
const parser = require('ua-parser-js');
const UserSession = require('../models/UserSession');

class SessionService {
  /**
   * Create a session for a user and return a signed JWT
   * @param {Object} user - User document
   * @param {Object} req - Express request object (to extract IP and User-Agent)
   * @returns {Promise<string>} Signed JWT containing the sessionId
   */
  static async createSessionAndJwt(user, req) {
    const userAgent = req.get('User-Agent') || '';
    const ua = parser(userAgent);
    
    // Format device/browser nicely
    const deviceName = ua.device.vendor && ua.device.model 
      ? `${ua.device.vendor} ${ua.device.model}`
      : ua.os.name 
        ? `${ua.os.name} PC`
        : 'Unknown Device';
        
    const browserName = ua.browser.name 
      ? `${ua.browser.name} ${ua.browser.version || ''}`.trim()
      : 'Unknown Browser';
      
    const deviceType = ['mobile', 'tablet', 'smarttv', 'console', 'wearable', 'embedded'].includes(ua.device.type) 
      ? ua.device.type 
      : (ua.device.type || 'desktop'); // Fallback to desktop if not strictly mobile/etc

    const session = await UserSession.create({
      userId: user._id,
      device: deviceName,
      deviceType: ['mobile', 'tablet'].includes(deviceType) ? deviceType : 'desktop',
      browser: browserName,
      ip: req.ip || 'Unknown IP'
    });

    const token = jwt.sign(
      { 
        sub: user._id.toString(), 
        email: user.email, 
        username: user.username, 
        role: user.role,
        sessionId: session._id.toString() 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return { token, session };
  }
}

module.exports = SessionService;
