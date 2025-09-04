const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        req.user = payload; // Set req.user instead of req.userJwt
        next();
    } catch (e) {
        console.error('JWT verification failed:', e?.message || e);
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

function requireAdmin(req, res, next) {
    // First authenticate the user
    requireAuth(req, res, () => {
        // Then check if they're an admin
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    });
}

module.exports = { requireAuth, requireAdmin };




