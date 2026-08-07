const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getCache, setCache } = require('../lib/redis');

async function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        req.user = payload; // Set req.user instead of req.userJwt
        
        // Check ban state lazily by userId
        const userId = payload?.sub || payload?.userId || null;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        
        const cacheKey = `user:auth:${userId}`;
        let u = await getCache(cacheKey);
        if (!u) {
            u = await User.findById(userId).select('ban role').lean();
            if (u) {
                await setCache(cacheKey, u, 60);
            }
        }
        
        if (!u) return res.status(401).json({ error: 'Unauthorized' });
        
        const ban = u.ban || {};
        const active = Boolean(ban.isBanned) && (!ban.until || new Date(ban.until) > new Date());
        
        if (active) {
            return res.status(403).json({ 
                error: 'Account banned', 
                reason: String(ban.reason || ''), 
                until: ban.until || null 
            });
        }
        
        next();
    } catch (e) {
        if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        console.error('Auth middleware failed:', e?.message || e);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function requireAdmin(req, res, next) {
    // First authenticate the user
    await requireAuth(req, res, () => {
        // Then check if they're an admin
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    });
}

module.exports = { requireAuth, requireAdmin };




