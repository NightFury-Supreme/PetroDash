const jwt = require('jsonwebtoken');
const parser = require('ua-parser-js');
const UserSession = require('../models/UserSession');
const { resolveClientIp, resolveUserAgent, resolveClientLocation } = require('../utils/clientInfo');
const { setCache, deleteCache } = require('../lib/redis');

class SessionService {
  static async createSessionAndJwt(user, req) {
    const userAgent = resolveUserAgent(req);
    const ua = parser(userAgent);

    const deviceType = ['mobile', 'tablet'].includes(ua.device?.type)
      ? ua.device.type
      : 'desktop';

    let deviceName = 'Unknown Device';
    if (ua.device?.vendor && ua.device?.model && ua.device.model !== 'K') {
      deviceName = `${ua.device.vendor} ${ua.device.model}`.trim();
    } else if (ua.device?.model && ua.device.model !== 'K') {
      deviceName = ua.device.model.trim();
    } else if (ua.os?.name) {
      deviceName = ['mobile', 'tablet'].includes(deviceType)
        ? `${ua.os.name} Device`
        : (ua.os.name === 'macOS' || ua.os.name === 'Mac OS' ? 'Apple Mac' : `${ua.os.name} PC`);
    }

    const browserName = ua.browser?.name
      ? `${ua.browser.name} ${ua.browser.major || ua.browser.version || ''}`.trim()
      : 'Unknown Browser';

    const ip = resolveClientIp(req) || 'Unknown IP';
    const location = await resolveClientLocation(req, ip);

    const session = await UserSession.create({
      userId: user._id,
      device: deviceName,
      deviceType: ['mobile', 'tablet'].includes(deviceType) ? deviceType : 'desktop',
      browser: browserName,
      ip,
      location,
    });

    const pubId = session.publicId;

    await Promise.all([
      pubId ? setCache(`session:valid:${pubId}`, true, 300) : Promise.resolve(),
      deleteCache(`user:${user.publicId}:sessions`),
    ]).catch(() => {});

    const token = jwt.sign(
      {
        sub: user.publicId,
        email: user.email,
        username: user.username,
        role: user.role,
        sessionId: pubId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    return { token, session };
  }
}

module.exports = SessionService;
