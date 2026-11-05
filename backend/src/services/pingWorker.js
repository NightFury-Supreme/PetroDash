const { setCache, deleteCache, publishEvent } = require('../lib/redis');

const PING_INTERVAL_MS = 30 * 1000;
const PING_TTL_SECONDS = 120;
const PING_TIMEOUT_MS = 3000;

async function pingUrl(latencyUrl) {
    if (!latencyUrl || latencyUrl.trim() === '') return null;

    let url = latencyUrl.trim();

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
        url = isLocal ? `http://${url}` : `https://${url}`;
    }

    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return -1;
        const host = parsed.hostname.toLowerCase();
        if (host === '169.254.169.254' || host.startsWith('169.254.')) return -1;
    } catch {
        return -1;
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
    } catch (_headErr) {
        try {
            return await doFetch(url, 'GET');
        } catch (_getErr) {
            if (url.startsWith('https://')) {
                try {
                    return await doFetch(url.replace('https://', 'http://'), 'GET');
                } catch (_httpsErr) {
                    return -1;
                }
            } else if (!url.startsWith('http://')) {
                try {
                    return await doFetch(`http://${url.replace(/^https?:\/\//, '')}`, 'GET');
                } catch (_httpErr) {
                    return -1;
                }
            }
            return -1;
        }
    }
}

let workerInterval = null;

async function recordUptime(nodeId, isUp) {
    try {
        const UptimeLog = require('../models/UptimeLog');
        const date = new Date().toISOString().split('T')[0];
        
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
    } catch (_recordErr) {}
}

async function runPingSweep() {
    try {
        let panelUp = false;
        if (process.env.PTERO_BASE_URL) {
            const panelPing = await pingUrl(process.env.PTERO_BASE_URL);
            panelUp = panelPing !== -1 && panelPing !== null;
            await setCache('ping:panel', { ping: panelPing, updatedAt: new Date().toISOString() }, PING_TTL_SECONDS);
        }
        await recordUptime('panel', panelUp);

        const Location = require('../models/Location');
        const locations = await Location.find({}, { _id: 1, publicId: 1, name: 1, latencyUrl: 1 }).lean();

        await Promise.all(
            locations.map(async (location) => {
                const ping = await pingUrl(location.latencyUrl);
                const isUp = ping !== -1 && ping !== null;
                const locPubId = location.publicId;
                if (locPubId) {
                    await setCache(`ping:${locPubId}`, { ping, updatedAt: new Date().toISOString() }, PING_TTL_SECONDS);
                    await recordUptime(locPubId, isUp);
                }
            })
        );

        await deleteCache('api:status');
        const statusService = require('../modules/status/status.service');
        const freshStatus = await statusService.getSystemStatus();
        await publishEvent('system:status', { type: 'STATUS_UPDATED', data: freshStatus });
    } catch (_sweepErr) {}
}

function startPingWorker() {
    if (workerInterval) return;
    runPingSweep();
    workerInterval = setInterval(runPingSweep, PING_INTERVAL_MS);
}

function stopPingWorker() {
    if (workerInterval) {
        clearInterval(workerInterval);
        workerInterval = null;
    }
}

module.exports = { startPingWorker, stopPingWorker, runPingSweep };
