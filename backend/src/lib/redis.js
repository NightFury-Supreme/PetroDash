const Redis = require('ioredis');

// In-memory fallback when Redis is not configured/available
const memoryCache = new Map();

let client = null;
let usingMemoryFallback = false;

function getClient() {
    if (client) return client;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        if (!usingMemoryFallback) {
            console.warn('[Redis] REDIS_URL not set — using in-memory cache fallback. Set REDIS_URL for production use.');
            usingMemoryFallback = true;
        }
        return null;
    }

    client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > 3) {
                console.warn(`[Redis] Could not connect after ${times} retries — falling back to in-memory cache.`);
                usingMemoryFallback = true;
                client = null;
                return null; // stop retrying
            }
            return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
    });

    client.on('connect', () => {
        console.log('[Redis] Connected successfully.');
        usingMemoryFallback = false;
    });

    client.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
    });

    client.connect().catch(() => {
        usingMemoryFallback = true;
        client = null;
    });

    return client;
}

/**
 * Get a cached value by key.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
async function getCache(key) {
    const redis = getClient();

    if (!redis || usingMemoryFallback) {
        const entry = memoryCache.get(key);
        if (!entry) return null;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            memoryCache.delete(key);
            return null;
        }
        return entry.value;
    }

    try {
        const raw = await redis.get(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/**
 * Set a cached value.
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds
 */
async function setCache(key, value, ttlSeconds = 120) {
    const redis = getClient();

    if (!redis || usingMemoryFallback) {
        memoryCache.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
        return;
    }

    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
        console.error('[Redis] setCache error:', err.message);
        // fallback to memory
        memoryCache.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }
}

/**
 * Delete a cached value.
 * @param {string} key
 */
async function deleteCache(key) {
    const redis = getClient();

    if (!redis || usingMemoryFallback) {
        memoryCache.delete(key);
        return;
    }

    try {
        await redis.del(key);
    } catch (err) {
        console.error('[Redis] deleteCache error:', err.message);
    }
}

/**
 * Delete all keys matching a pattern.
 * @param {string} pattern - e.g. "ping:*"
 */
async function deleteCachePattern(pattern) {
    const redis = getClient();

    if (!redis || usingMemoryFallback) {
        for (const key of memoryCache.keys()) {
            if (key.startsWith(pattern.replaceAll('*', ''))) {
                memoryCache.delete(key);
            }
        }
        return;
    }

    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (err) {
        console.error('[Redis] deleteCachePattern error:', err.message);
    }
}

module.exports = { getClient, getCache, setCache, deleteCache, deleteCachePattern };
