const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getCache, setCache } = require('../lib/redis');
const AppError = require('../utils/AppError');

async function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next(AppError.unauthorized('Unauthorized', 'ERR_UNAUTHORIZED'));
    
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        req.user = payload; // Set req.user instead of req.userJwt
        
        // Check ban state lazily by userId
        const userId = payload?.sub || payload?.userId || null;
        if (!userId) return next(AppError.unauthorized('Unauthorized', 'ERR_UNAUTHORIZED'));
        
        const cacheKey = `user:auth:${userId}`;
        let u = await getCache(cacheKey);
        if (!u) {
            u = await User.findById(userId).select('ban role').lean();
            if (u) {
                await setCache(cacheKey, u, 60);
            }
        }
        
        if (!u) return next(AppError.unauthorized('Unauthorized', 'ERR_UNAUTHORIZED'));
        
        const ban = u.ban || {};
        const active = Boolean(ban.isBanned) && (!ban.until || new Date(ban.until) > new Date());
        
        if (active) {
            return next(AppError.forbidden('Account banned', 'ERR_ACCOUNT_BANNED', { 
                reason: String(ban.reason || ''), 
                until: ban.until || null 
            }));
        }
        
        // Active Session Validation (Option A: Legacy tokens without sessionId still allowed)
        if (payload.sessionId) {
            const sessionCacheKey = `session:valid:${payload.sessionId}`;
            let isSessionValid = await getCache(sessionCacheKey);
            
            if (isSessionValid === null) {
                // Not in cache, query DB
                const UserSession = require('../models/UserSession');
                const sessionDoc = await UserSession.findById(payload.sessionId).lean();
                
                if (!sessionDoc) {
                    return next(AppError.unauthorized('Session revoked', 'ERR_SESSION_REVOKED'));
                }
                
                // Cache valid session for 60 seconds
                await setCache(sessionCacheKey, true, 60);
                
                // Passively update lastActive in DB
                UserSession.updateOne({ _id: payload.sessionId }, { $set: { lastActive: new Date() } }).catch(console.error);
            } else if (isSessionValid === false) {
                 return next(AppError.unauthorized('Session revoked', 'ERR_SESSION_REVOKED'));
            } else {
                // valid session cached, passively update last active every ~60s via the cache miss
            }
        }

        next();
    } catch (e) {
        if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
            return next(AppError.unauthorized('Unauthorized', 'ERR_UNAUTHORIZED'));
        }
        console.error('Auth middleware failed:', e?.message || e);
        return next(AppError.internal('Internal server error', 'ERR_INTERNAL_SERVER'));
    }
}

async function requireAdmin(req, res, next) {
    // First authenticate the user
    await requireAuth(req, res, (err) => {
        if (err) return next(err);
        // Then check if they're an admin
        if (req.user?.role !== 'admin') {
            return next(AppError.forbidden('Forbidden', 'ERR_FORBIDDEN'));
        }
        next();
    });
}

module.exports = { requireAuth, requireAdmin };




