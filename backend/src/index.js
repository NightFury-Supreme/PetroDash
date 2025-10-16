const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const passport = require('passport');
const { createRateLimiter } = require('./middleware/rateLimit');
const { securityHeaders, sanitizeInput, securityLogging } = require('./middleware/security');

dotenv.config();

const { connectToDatabase } = require('./lib/mongo');
const { validateEnv } = require('./lib/env');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const serverRoutes = require('./routes/server');
const publicEggRoutes = require('./routes/eggs');
const publicLocationRoutes = require('./routes/locations');
const panelRoutes = require('./routes/panel');
const shopRoutes = require('./routes/shop');
const paypalRoutes = require('./routes/paypal');
const paypalWebhook = require('./routes/paypalWebhook');
const { router: oauthRoutes } = require('./routes/auth/oauth');

const app = express();
// Respect Cloudflare/Proxy headers so req.ip and rate-limit source are correct
app.set('trust proxy', 1);
const { ensureShopPresets } = require('./lib/shopPresets');
const { sanitize } = require('./middleware/sanitize');
const { auditAuto } = require('./middleware/auditAuto');

// Use security headers from security middleware (includes proper CSP)
app.use(securityHeaders());
app.use(express.json({ limit: '1mb' }));
app.use(compression());
app.use(sanitizeInput);
app.use(securityLogging);
app.use(sanitize);
app.use(auditAuto());

// Session configuration for OAuth
app.use(session({
    secret: process.env.JWT_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// CORS configuration - require FRONTEND_URL to be set
const allowedOrigin = process.env.FRONTEND_URL;
if (!allowedOrigin) {
    console.error('ERROR: FRONTEND_URL environment variable is required for security');
    process.exit(1);
}
app.use(
    cors({
        origin: allowedOrigin,
        credentials: true,
        methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
        allowedHeaders: ['Content-Type','Authorization','Cache-Control','Pragma','If-Modified-Since','If-None-Match'],
    })
);

// Single global API rate limit
// Configure via env: API_RATE_MAX (default 3000), API_RATE_WINDOW_MS (default 15 min)
const API_RATE_MAX = Number(process.env.API_RATE_MAX || 3000);
const API_RATE_WINDOW_MS = Number(process.env.API_RATE_WINDOW_MS || (15 * 60 * 1000));
app.use('/api', createRateLimiter(API_RATE_MAX, API_RATE_WINDOW_MS));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve static uploads directory with CORS headers and security
const path = require('path');
app.use('/uploads', (req, res, next) => {
    // Prevent directory listing - only serve specific files
    if (req.path.endsWith('/') || req.path === '') {
        return res.status(403).json({ error: 'Directory listing forbidden' });
    }
    
    // Validate file extension to prevent serving unexpected file types
    const ext = path.extname(req.path).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    if (!allowedExtensions.includes(ext)) {
        return res.status(403).json({ error: 'File type not allowed' });
    }
    
    // Set CORS headers for static files
    res.header('Access-Control-Allow-Origin', allowedOrigin === '*' ? '*' : allowedOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Security headers to prevent XSS and content sniffing
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
    
    next();
}, express.static(path.join(__dirname, '../uploads'), {
    dotfiles: 'deny', // Prevent access to hidden files
    index: false, // Disable directory index
}));

// Public settings endpoint for client-side branding (read-only)
app.get('/api/settings', async (req, res) => {
    try {
        const Settings = require('./models/Settings');
        const s = await Settings.findOne({}).lean();
        if (!s) return res.json({});
        return res.json({ siteName: s.siteName, siteIcon: s.siteIcon });
    } catch (e) { return res.json({}); }
});

// New branding route
app.use('/api/branding', require('./routes/branding'));

// Upload route for file uploads
app.use('/api/upload', require('./routes/upload'));

// Public ads route
app.use('/api/ads', require('./routes/ads'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/updates', require('./routes/admin/updates'));
app.use('/api/servers', serverRoutes);
app.use('/api/eggs', publicEggRoutes);
app.use('/api/locations', publicLocationRoutes);
app.use('/api/panel', panelRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/gifts', require('./routes/gifts'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/paypal', paypalRoutes);
app.post('/api/paypal/webhook', paypalWebhook);
app.use('/api/plans', require('./routes/plans'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/user/plans', require('./routes/userPlans'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/oauth', oauthRoutes);

const port = process.env.PORT || 4000;

connectToDatabase()
    .then(() => {
        // Validate env after .env loaded and before serving requests
        validateEnv();
        // Seed shop presets once DB is connected
        ensureShopPresets().catch(() => {});
        app.listen(port, () => {
                    });
    })
    .catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });

// Centralized error handler (last middleware)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = status >= 500 ? 'Internal server error' : (err.message || 'Request failed');
    if (process.env.NODE_ENV !== 'production') {
        console.error('Unhandled error:', err);
    } else {
        console.error('Unhandled error:', { message: err?.message, status });
    }
    res.status(status).json({ error: message });
});


