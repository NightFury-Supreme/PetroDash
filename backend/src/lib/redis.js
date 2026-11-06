const Redis = require('ioredis');
const EventEmitter = require('events');

const memoryCache = new Map();
const eventBus = new EventEmitter();
let client = null;

function getClient() {
    if (client) return client;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        return null;
    }

    client = new Redis(redisUrl, {
        enableOfflineQueue: false, 
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        retryStrategy(_times) {
            return 5000;
        },
    });

    client.on('ready', () => {});
    client.on('error', (_err) => {});

    return client;
}

function shouldUseMemory() {
    const redis = getClient();
    if (!redis) return true;
    return redis.status !== 'ready';
}

async function withTimeout(promise, ms = 800) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Redis timeout')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
        const raw = await withTimeout(getClient().get(key), 800);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (_redisGetErr) {
        const entry = memoryCache.get(key);
        if (entry && (!entry.expiresAt || Date.now() < entry.expiresAt)) {
            return entry.value;
        }
        return null;
    }
}

async function getCacheMany(keys) {
    if (!keys || keys.length === 0) return [];

    if (shouldUseMemory()) {
        return keys.map((key) => {
            const entry = memoryCache.get(key);
            if (!entry) return null;
            if (entry.expiresAt && Date.now() > entry.expiresAt) {
                memoryCache.delete(key);
                return null;
            }
            return entry.value;
        });
    }

    try {
        const raws = await withTimeout(getClient().mget(...keys), 800);
        if (!raws) return keys.map(() => null);
        return raws.map((raw, idx) => {
            if (!raw) {
                const entry = memoryCache.get(keys[idx]);
                if (entry && (!entry.expiresAt || Date.now() < entry.expiresAt)) {
                    return entry.value;
                }
                return null;
            }
            try {
                return JSON.parse(raw);
            } catch (_parseErr) {
                return null;
            }
        });
    } catch (_redisMgetErr) {
        return keys.map((key) => {
            const entry = memoryCache.get(key);
            if (entry && (!entry.expiresAt || Date.now() < entry.expiresAt)) {
                return entry.value;
            }
            return null;
        });
    }
}

async function setCache(key, value, ttlSeconds = 120) {
    memoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
    });

    if (!shouldUseMemory()) {
        try {
            await withTimeout(getClient().set(key, JSON.stringify(value), 'EX', ttlSeconds), 800);
        } catch (_setErr) {}
    }
}

async function deleteCache(key) {
    memoryCache.delete(key);

    if (!shouldUseMemory()) {
        try {
            await withTimeout(getClient().del(key), 800);
        } catch (_delErr) {}
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
            const searchPattern = pattern.includes('*') ? pattern : `${pattern}*`;
            await withTimeout(
                new Promise((resolve, reject) => {
                    const redisClient = getClient();
                    if (!redisClient) return resolve();
                    const stream = redisClient.scanStream({ match: searchPattern, count: 100 });
                    const keys = [];
                    stream.on('data', (chunk) => {
                        if (chunk && chunk.length > 0) keys.push(...chunk);
                    });
                    stream.on('end', async () => {
                        try {
                            if (keys.length > 0) {
                                await redisClient.del(...keys);
                            }
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    });
                    stream.on('error', (err) => reject(err));
                }),
                1000
            );
        } catch (_scanTimeoutErr) {}
    }
}

async function acquireLock(key, ttlMs = 15000) {
    const crypto = require('crypto');
    const token = crypto.randomUUID();
    if (shouldUseMemory()) {
        const existing = memoryCache.get(`lock:${key}`);
        if (existing && existing.expiresAt > Date.now()) {
            return null;
        }
        memoryCache.set(`lock:${key}`, { value: token, expiresAt: Date.now() + ttlMs });
        return token;
    }
    try {
        const result = await withTimeout(
            getClient().set(`lock:${key}`, token, 'PX', ttlMs, 'NX'),
            800
        );
        return result === 'OK' ? token : null;
    } catch (_lockErr) {
        const existing = memoryCache.get(`lock:${key}`);
        if (existing && existing.expiresAt > Date.now()) {
            return null;
        }
        memoryCache.set(`lock:${key}`, { value: token, expiresAt: Date.now() + ttlMs });
        return token;
    }
}

async function releaseLock(key, token) {
    if (!token) return false;
    if (shouldUseMemory()) {
        const existing = memoryCache.get(`lock:${key}`);
        if (existing && existing.value === token) {
            memoryCache.delete(`lock:${key}`);
            return true;
        }
        return false;
    }
    try {
        const luaScript = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';
        const res = await withTimeout(getClient().eval(luaScript, 1, `lock:${key}`, token), 1500);
        return res === 1;
    } catch (_evalErr) {
        try {
            const redis = getClient();
            if (redis && (await withTimeout(redis.get(`lock:${key}`), 800)) === token) {
                await withTimeout(redis.del(`lock:${key}`), 800);
            }
        } catch (_redisDelErr) {}
        const existing = memoryCache.get(`lock:${key}`);
        if (existing && existing.value === token) {
            memoryCache.delete(`lock:${key}`);
            return true;
        }
        return false;
    }
}

async function publishEvent(channel, message) {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    eventBus.emit(channel, payload);
    if (!shouldUseMemory()) {
        try {
            await getClient().publish(channel, payload);
        } catch (_pubErr) {}
    }
}

function subscribeLocalEvent(channel, callback) {
    eventBus.on(channel, callback);
    return () => {
        eventBus.off(channel, callback);
    };
}

const inFlightPromises = new Map();

async function getOrSetCache(key, fetcherFn, ttlSeconds = 120) {
    const cached = await getCache(key);
    if (cached !== null && cached !== undefined) {
        return cached;
    }

    if (inFlightPromises.has(key)) {
        return inFlightPromises.get(key);
    }

    const promise = (async () => {
        try {
            const data = await fetcherFn();
            if (data !== null && data !== undefined) {
                await setCache(key, data, ttlSeconds);
            }
            return data;
        } finally {
            inFlightPromises.delete(key);
        }
    })();

    inFlightPromises.set(key, promise);
    return promise;
}

module.exports = { 
    getClient, 
    withTimeout,
    getCache, 
    getCacheMany, 
    setCache, 
    getOrSetCache,
    deleteCache, 
    deleteCachePattern,
    acquireLock,
    releaseLock,
    publishEvent,
    subscribeLocalEvent
};
