const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
 
const compression = require('compression');
const passport = require('passport');
const { createRateLimiter } = require('./middleware/rateLimit');
const { securityHeaders, sanitizeInput, securityLogging, csrfProtection } = require('./middleware/security');

const { connectToDatabase } = require('./lib/mongo');
const { validateEnv } = require('./lib/env');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const serverRoutes = require('./routes/server');
const publicEggRoutes = require('./routes/eggs');
const publicLocationRoutes = require('./routes/locations');
const { panelRoutes } = require('./modules/panel');
const shopRoutes = require('./modules/shop/shop.routes');
const paypalRoutes = require('./routes/paypal');
const paypalWebhook = require('./routes/paypalWebhook');
const { router: oauthRoutes } = require('./routes/auth/oauth');
const earnRoutes = require('./routes/earn');
const AppError = require('./utils/AppError');

const app = express();
app.set('trust proxy', 1);
const { ensureShopPresets } = require('./lib/shopPresets');
const { sanitize } = require('./middleware/sanitize');
const { auditAuto } = require('./middleware/auditAuto');
const requestIdMiddleware = require('./middleware/requestId');

app.use(requestIdMiddleware);
app.use(securityHeaders());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(
    compression({
        filter: (req, res) => {
            if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
                return false;
            }
            if (req.url && req.url.includes('/stream')) {
                return false;
            }
            return compression.filter(req, res);
        },
    })
);
app.use(sanitizeInput);
app.use(securityLogging);
app.use(sanitize);
app.use(auditAuto());
app.use(csrfProtection);

app.use(passport.initialize());

const allowedOrigin = process.env.FRONTEND_URL;
if (!allowedOrigin) {
    process.stderr.write('FATAL: FRONTEND_URL environment variable is required\n');
    process.exit(1);
}

const parseAllowedOrigins = (envUrl) => {
    try {
        const u = new URL(envUrl);
        const altProtocol = u.protocol === 'https:' ? 'http:' : 'https:';
        return [envUrl.replace(/\/+$/, ''), `${altProtocol}//${u.host}`];
    } catch {
        return [envUrl.replace(/\/+$/, '')];
    }
};
const allowedOrigins = parseAllowedOrigins(allowedOrigin);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error('ERR_CORS_NOT_ALLOWED'));
        },
        credentials: true,
        methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
        allowedHeaders: ['Content-Type','Authorization','Cache-Control','Pragma','If-Modified-Since','If-None-Match'],
    })
);

const API_RATE_MAX = Number(process.env.API_RATE_MAX || 500);
const API_RATE_WINDOW_MS = Number(process.env.API_RATE_WINDOW_MS || (15 * 60 * 1000));
app.use('/api', createRateLimiter(API_RATE_MAX, API_RATE_WINDOW_MS));

const mongoose = require('mongoose');

const handleHealthCheck = (_req, res) => {
    const mongoReady = mongoose.connection.readyState === 1;
    const { getClient } = require('./lib/redis');
    const redis = getClient();
    const redisReady = !redis || redis.status === 'ready' || redis.status === 'connect';

    if (mongoReady && redisReady) {
        return res.status(200).json({
            status: 'ok',
            mongo: 'connected',
            redis: redis ? redis.status : 'memory',
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
        });
    }

    return res.status(503).json({
        status: 'error',
        mongo: mongoReady ? 'connected' : 'disconnected',
        redis: redis ? redis.status : 'disconnected',
    });
};

app.get('/api/health', handleHealthCheck);

const fs = require('fs');
const path = require('path');
const DEFAULT_AVATAR_PATH = path.join(__dirname, '../cdn/avatars/default.webp');
const staticMediaHandler = [
    (req, res, next) => {
        if (req.method === 'OPTIONS') {
            res.header('Access-Control-Allow-Origin', allowedOrigin === '*' ? '*' : allowedOrigin);
            res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            return res.sendStatus(204);
        }

        if (req.path.endsWith('/') || req.path === '') {
            return next(AppError.forbidden('Directory listing forbidden', 'ERR_FORBIDDEN'));
        }
        
        const ext = path.extname(req.path).toLowerCase();
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
        
        if (!allowedExtensions.includes(ext)) {
            return next(AppError.forbidden('File type not allowed', 'ERR_UPLOAD_INVALID_IMAGE'));
        }
        
        res.header('Access-Control-Allow-Origin', allowedOrigin === '*' ? '*' : allowedOrigin);
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Cross-Origin-Resource-Policy', 'cross-origin');
        
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
        
        if (req.path.startsWith('/avatars/')) {
            res.header('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
            res.header('Cache-Control', 'public, max-age=86400');
        }
        
        next();
    },
    express.static(path.join(__dirname, '../cdn'), {
        dotfiles: 'deny',
        index: false,
        fallthrough: false,
    }),
];

app.use('/cdn', staticMediaHandler, (req, res) => {
    if (req.path && req.path.startsWith('/avatars/') && fs.existsSync(DEFAULT_AVATAR_PATH)) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        return res.sendFile(DEFAULT_AVATAR_PATH);
    }
    res.status(404).json({
        error: 'ERR_FILE_NOT_FOUND',
        message: 'The requested static asset was not found',
    });
});

app.use('/cdn', (err, req, res, _next) => {
    if (req.path && req.path.startsWith('/avatars/') && fs.existsSync(DEFAULT_AVATAR_PATH)) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        return res.sendFile(DEFAULT_AVATAR_PATH);
    }
    res.status(err.status || 404).json({
        error: 'ERR_FILE_NOT_FOUND',
        message: 'The requested static asset was not found',
    });
});

app.use('/api/config', require('./routes/config'));

app.use('/api/upload', require('./routes/upload'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/eggs', publicEggRoutes);
app.use('/api/locations', publicLocationRoutes);
app.use('/api/panel', panelRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/gifts', require('./modules/gift/gift.routes'));
app.use('/api/tickets', require('./modules/ticket/ticket.routes'));
app.use('/api/paypal', paypalRoutes);
app.post('/api/paypal/webhook', paypalWebhook);

app.use('/api/plans', require('./modules/plan/plan.routes'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/user/plans', require('./routes/userPlans'));
app.use('/api/referrals', require('./modules/referrals/referrals.routes'));
app.use('/api/earn', earnRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/activity', require('./routes/activity'));
app.use('/api/status', require('./routes/status'));
app.use('/api/coupons', require('./modules/coupon/coupon.routes'));
app.use('/api/subscriptions', require('./routes/subscriptions'));

const port = process.env.PORT || 4000;

connectToDatabase()
    .then(() => {
        validateEnv();
        ensureShopPresets().catch(() => {});
        const { ensureDefaultAvatar } = require('./services/avatarService');
        ensureDefaultAvatar().catch(() => {});
        const { startPingWorker } = require('./services/pingWorker');
        startPingWorker();
        const { startBackgroundJobs } = require('./jobs');
        startBackgroundJobs();

        const server = app.listen(port, () => {
            process.stdout.write(`[PteroDash] Server running on port ${port} (${process.env.NODE_ENV || 'development'})\n`);
        });

        const gracefulShutdown = () => {
            server.close(async () => {
                try {
                    await mongoose.connection.close(false);
                    const { getClient } = require('./lib/redis');
                    const redis = getClient();
                    if (redis && redis.status === 'ready') await redis.quit();
                } catch (shutdownErr) {
                    process.stderr.write(`[Shutdown] Error: ${shutdownErr.message}\n`);
                }
                process.exit(0);
            });
            setTimeout(() => process.exit(1), 10000).unref();
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    })
    .catch((err) => {
        process.stderr.write(`FATAL: ${err.message}\n`);
        process.exit(1);
    });

app.use((err, req, res, _next) => {
    let status = 500;
    let code = 'ERR_INTERNAL_SERVER';
    let message = 'Internal server error';
    let details = null;

    if (err && err.isOperational) {
        status = typeof err.statusCode === 'number' ? err.statusCode : 500;
        code = typeof err.code === 'string' && err.code ? err.code : 'ERR_BAD_REQUEST';
        message = typeof err.message === 'string' && err.message ? err.message : 'An error occurred';
        if (err.details && typeof err.details === 'object' && !err.details.stack && !err.details.isAxiosError && !err.details.config) {
            details = err.details;
        }
    } else if (err && err.type === 'entity.parse.failed') {
        status = 400;
        code = 'ERR_INVALID_JSON';
        message = 'Malformed JSON in request body';
    } else if (err && err.code === 'LIMIT_FILE_SIZE') {
        status = 400;
        code = 'ERR_FILE_TOO_LARGE';
        message = 'File exceeds maximum upload size';
    }

    res.status(status).json({
        error: code,
        message,
        details,
    });
});

