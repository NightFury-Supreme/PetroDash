const { setCache } = require('../lib/redis');

const PING_INTERVAL_MS = 30 * 1000; // 30 seconds
const PING_TTL_SECONDS = 120;       // 2 minutes (expires if worker crashes)
const PING_TIMEOUT_MS = 3000;

/**
 * Ping a latencyUrl and return ms, or -1 on failure.
 * Handles localhost → http://, others → https://
 * Retries https:// with http:// on failure.
 * @param {string} latencyUrl
 * @returns {Promise<number>}
 */
async function pingUrl(latencyUrl) {
    if (!latencyUrl || latencyUrl.trim() === '') return null;

    let url = latencyUrl.trim();

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
        url = isLocal ? `http://${url}` : `https://${url}`;
    }

    const doFetch = async (targetUrl, method = 'HEAD') => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
        const start = Date.now();
        await fetch(targetUrl, { method, signal: controller.signal });
        clearTimeout(timeoutId);
        return Date.now() - start;
    };

    try {
        return await doFetch(url);
    } catch {
        // Fallback 1: Try GET if HEAD failed (some servers block HEAD)
        try {
            return await doFetch(url, 'GET');
        } catch {
            // Fallback 2: Try HTTP instead of HTTPS
            if (url.startsWith('https://')) {
                try {
                    return await doFetch(url.replace('https://', 'http://'), 'GET');
                } catch {
                    return -1;
                }
            } else if (!url.startsWith('http://')) {
                // If it was just 'localhost' and somehow got mangled, force http
                try {
                    return await doFetch(`http://${url.replace(/^https?:\/\//, '')}`, 'GET');
                } catch {
                    return -1;
                }
            }
            return -1;
        }
    }
}

let workerInterval = null;

/**
 * Helper to record uptime log in DB.
 */
async function recordUptime(nodeId, isUp) {
    try {
        const UptimeLog = require('../models/UptimeLog');
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        await UptimeLog.updateOne(
            { nodeId, date },
            { 
                $inc: { 
                    totalChecks: 1,
                    upChecks: isUp ? 1 : 0,
                    downChecks: isUp ? 0 : 1
                }
            },
            { upsert: true }
        );
    } catch (err) {
        console.error(`[PingWorker] Failed to record uptime for ${nodeId}:`, err.message);
    }
}

/**
 * Run a single ping sweep across all locations and the panel.
 */
async function runPingSweep() {
    try {
        // Record Panel Uptime by pinging PTERO_BASE_URL
        let panelUp = false;
        if (process.env.PTERO_BASE_URL) {
            const panelPing = await pingUrl(process.env.PTERO_BASE_URL);
            panelUp = panelPing !== -1 && panelPing !== null;
            await setCache('ping:panel', { ping: panelPing, updatedAt: new Date().toISOString() }, PING_TTL_SECONDS);
            // console.log(`[PingWorker] "Panel" → ${!panelUp ? 'DOWN' : `${panelPing}ms`}`);
        }
        await recordUptime('panel', panelUp);

        // Lazy-load to avoid circular deps at startup
        const Location = require('../models/Location');
        const locations = await Location.find({}, { _id: 1, name: 1, latencyUrl: 1 }).lean();

        await Promise.all(
            locations.map(async (location) => {
                const ping = await pingUrl(location.latencyUrl);
                const isUp = ping !== -1 && ping !== null;
                const cacheKey = `ping:${location._id}`;
                await setCache(cacheKey, { ping, updatedAt: new Date().toISOString() }, PING_TTL_SECONDS);
                
                await recordUptime(location._id.toString(), isUp);
                
                // console.log(`[PingWorker] "${location.name}" -> ${!isUp ? 'DOWN' : `${ping}ms`}`);
            })
        );
    } catch (err) {
        console.error('[PingWorker] Sweep error:', err.message);
    }
}

/**
 * Start the background ping worker.
 * Should be called once after DB connection is established.
 */
function startPingWorker() {
    if (workerInterval) return; // already running

    console.log('[PingWorker] Starting — pinging all locations every 30 seconds.');

    // Run immediately on startup, then every interval
    runPingSweep();
    workerInterval = setInterval(runPingSweep, PING_INTERVAL_MS);
}

/**
 * Stop the background ping worker (useful for graceful shutdown / tests).
 */
function stopPingWorker() {
    if (workerInterval) {
        clearInterval(workerInterval);
        workerInterval = null;
        console.log('[PingWorker] Stopped.');
    }
}

module.exports = { startPingWorker, stopPingWorker, runPingSweep };
