const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

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

const app = express();
// Respect Cloudflare/Proxy headers so req.ip and rate-limit source are correct
app.set('trust proxy', 1);
const { ensureShopPresets } = require('./lib/shopPresets');
const { sanitize } = require('./middleware/sanitize');
const { createRateLimiter } = require('./middleware/rateLimit');
const { auditAuto } = require('./middleware/auditAuto');

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: '1mb' }));
app.use(compression());
app.use(sanitize);
app.use(auditAuto());

const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(
    cors({
        origin: allowedOrigin === '*' ? true : allowedOrigin,
        credentials: true,
        methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
        allowedHeaders: ['Content-Type','Authorization'],
    })
);

// Baseline rate limits
app.use('/api/auth', createRateLimiter(60, 15 * 60 * 1000));
app.use('/api', createRateLimiter(1000, 15 * 60 * 1000));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Public settings endpoint for client-side branding (read-only)
app.get('/api/settings', async (req, res) => {
    try {
        const Settings = require('./models/Settings');
        const s = await Settings.findOne({}).lean();
        if (!s) return res.json({});
        return res.json({ siteName: s.siteName, siteIconUrl: s.siteIconUrl });
    } catch (e) { return res.json({}); }
});

// New branding route
app.use('/api/branding', require('./routes/branding'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/eggs', publicEggRoutes);
app.use('/api/locations', publicLocationRoutes);
app.use('/api/panel', panelRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/paypal', paypalRoutes);
app.post('/api/paypal/webhook', paypalWebhook);
app.use('/api/plans', require('./routes/plans'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/user/plans', require('./routes/userPlans'));
app.use('/api/referrals', require('./routes/referrals'));

const port = process.env.PORT || 4000;

connectToDatabase()
    .then(() => {
        // Validate env after .env loaded and before serving requests
        validateEnv();
        // Seed shop presets once DB is connected
        ensureShopPresets().catch(() => {});
        app.listen(port, () => {
            console.log(`Backend listening on http://localhost:${port}`);
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


