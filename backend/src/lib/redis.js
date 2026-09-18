const Redis = require('ioredis');

const memoryCache = new Map();
let client = null;

function getClient() {
    if (client) return client;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        console.warn('[Redis] REDIS_URL not set - using in-memory cache fallback entirely.');
        return null;
    }

    client = new Redis(redisUrl, {
        // Buffer commands while offline (required for rate-limit-redis and express-session)
        enableOfflineQueue: true, 
        // Only retry once per request
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
            console.warn(`[Redis] Connection attempt ${times} failed. Retrying in 5s...`);
            return 5000;
        },
    });

    client.on('ready', () => {
        console.log('[Redis] Connected and ready.');
    });

    client.on('error', (_err) => {
        // Prevent unhandled error crashes. ioredis automatically reconnects.
    });

    return client;
}

function shouldUseMemory() {
    const redis = getClient();
    if (!redis) return true;
    return redis.status !== 'ready';
}

async function getCache(key) {
    if (shouldUseMemory()) {
        const entry = memoryCache.get(key);
        if (!entry) return null;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            memoryCache.delete(key);
            return null;
        }
        return entry.value;
    }

    try {
        const raw = await getClient().get(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        // Fallback to memory on immediate failure
        const entry = memoryCache.get(key);
        if (entry && (!entry.expiresAt || Date.now() < entry.expiresAt)) {
            return entry.value;
        }
        return null;
    }
}

async function setCache(key, value, ttlSeconds = 120) {
    // Always store in memory as a fast backup layer
    memoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
    });

    if (!shouldUseMemory()) {
        try {
            await getClient().set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch {
            // Ignore error, already in memory
        }
    }
}

async function deleteCache(key) {
    memoryCache.delete(key);

    if (!shouldUseMemory()) {
        try {
            await getClient().del(key);
        } catch {
            // Ignore
        }
    }
}

async function deleteCachePattern(pattern) {
    const prefix = pattern.replaceAll('*', '');
    for (const key of memoryCache.keys()) {
        if (key.startsWith(prefix)) {
            memoryCache.delete(key);
        }
    }

    if (!shouldUseMemory()) {
        try {
            const keys = await getClient().keys(pattern);
            if (keys.length > 0) {
                await getClient().del(...keys);
            }
        } catch {
            // Ignore
        }
    }
}

module.exports = { getClient, getCache, setCache, deleteCache, deleteCachePattern };
