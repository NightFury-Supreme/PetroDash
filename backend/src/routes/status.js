const express = require('express');
const Location = require('../models/Location');
const UptimeLog = require('../models/UptimeLog');
const { getCache } = require('../lib/redis');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const locations = await Location.find({}, { _id: 1, name: 1, flag: 1 }).lean();
        
        // Calculate dates for the last 90 days
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 90);
        const dateStrLimit = dateLimit.toISOString().split('T')[0];

        const uptimeLogs = await UptimeLog.find({ date: { $gte: dateStrLimit } }).lean();

        // Helper to calculate overall uptime % and build the 90-day history array
        const processUptimeHistory = (logs) => {
            const history = [];
            let totalUp = 0;
            let totalChecks = 0;

            // Fill 90 days
            for (let i = 89; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const log = logs.find(l => l.date === dateStr);
                if (log && log.totalChecks > 0) {
                    const dayUptime = (log.upChecks / log.totalChecks) * 100;
                    let status = 'Operational';
                    if (dayUptime < 95) status = 'Major Outage';
                    else if (dayUptime < 99) status = 'Partial Outage';
                    else if (dayUptime < 100) status = 'Degraded';
                    
                    const downChecks = log.totalChecks - log.upChecks;
                    const downtimeMinutes = Math.round((downChecks * 30) / 60);

                    history.push({
                        date: dateStr,
                        status,
                        uptime: dayUptime,
                        downtimeMinutes
                    });
                    totalUp += log.upChecks;
                    totalChecks += log.totalChecks;
                } else {
                    history.push({
                        date: dateStr,
                        status: 'No Data',
                        uptime: 0,
                        downtimeMinutes: 0
                    });
                }
            }
            const overallUptime = totalChecks === 0 ? 100 : Number(((totalUp / totalChecks) * 100).toFixed(2));
            return { overallUptime, history };
        };

        // Panel Uptime
        const panelLogs = uptimeLogs.filter(l => l.nodeId === 'panel');
        const { overallUptime: panelUptime, history: panelHistory } = processUptimeHistory(panelLogs);

        // Nodes Uptime
        const nodesData = await Promise.all(
            locations.map(async (loc) => {
                const logs = uptimeLogs.filter(l => l.nodeId === loc._id.toString());
                const { overallUptime, history } = processUptimeHistory(logs);
                
                // Get current ping
                const cacheData = await getCache(`ping:${loc._id}`);
                const ping = cacheData ? cacheData.ping : null;
                const status = (ping !== -1 && ping !== null) ? 'Operational' : 'Major Outage';

                return {
                    id: loc._id,
                    name: loc.name,
                    region: loc.flag,
                    status: status,
                    uptime: overallUptime,
                    ping: ping,
                    history: history
                };
            })
        );

        // Calculate global uptime (average of panel + all nodes)
        let totalUptimeSum = panelUptime;
        for (const n of nodesData) totalUptimeSum += n.uptime;
        const globalUptime = Number((totalUptimeSum / (nodesData.length + 1)).toFixed(2));

        // Get panel current ping
        const panelCacheData = await getCache(`ping:panel`);
        const panelPing = panelCacheData ? panelCacheData.ping : null;
        const panelStatus = (panelPing !== -1 && panelPing !== null) ? 'Operational' : 'Major Outage';

        res.json({
            globalUptime,
            panel: {
                status: panelStatus,
                uptime: panelUptime,
                ping: panelPing,
                history: panelHistory
            },
            nodes: nodesData
        });

    } catch (error) {
        console.error('Error fetching status data:', error);
        res.status(500).json({ error: 'Failed to fetch status data' });
    }
});

module.exports = router;
