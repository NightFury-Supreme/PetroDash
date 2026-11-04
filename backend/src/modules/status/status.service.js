const Location = require('../../models/Location');
const UptimeLog = require('../../models/UptimeLog');
const { getOrSetCache, getCacheMany } = require('../../lib/redis');
const AppError = require('../../utils/AppError');

class StatusService {
  async getSystemStatus() {
    try {
      return await getOrSetCache('api:status', async () => {
        const locations = await Location.find({}, { _id: 1, publicId: 1, name: 1, flag: 1 }).lean();

        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 90);
        const dateStrLimit = dateLimit.toISOString().split('T')[0];

        const uptimeLogs = await UptimeLog.find({ date: { $gte: dateStrLimit } })
          .select('nodeId date upChecks totalChecks')
          .lean();

        const processUptimeHistory = (logs) => {
          const history = [];
          let totalUp = 0;
          let totalChecks = 0;

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
                downtimeMinutes,
              });
              totalUp += log.upChecks;
              totalChecks += log.totalChecks;
            } else {
              history.push({
                date: dateStr,
                status: 'No Data',
                uptime: 0,
                downtimeMinutes: 0,
              });
            }
          }
          const overallUptime = totalChecks === 0 ? 100 : Number(((totalUp / totalChecks) * 100).toFixed(2));
          return { overallUptime, history };
        };

        const panelLogs = uptimeLogs.filter(l => l.nodeId === 'panel');
        const { overallUptime: panelUptime, history: panelHistory } = processUptimeHistory(panelLogs);

        const pingKeys = ['ping:panel', ...locations.map(loc => `ping:${loc.publicId}`)];
        const pingsData = await getCacheMany(pingKeys);

        const nodesData = locations.map((loc, idx) => {
          const logs = uptimeLogs.filter(l => l.nodeId === loc.publicId);
          const { overallUptime, history } = processUptimeHistory(logs);

          const cacheData = pingsData[idx + 1];
          const ping = cacheData ? cacheData.ping : null;
          const status = (ping !== -1 && ping !== null) ? 'Operational' : 'Major Outage';

          return {
            id: loc.publicId,
            name: loc.name,
            region: loc.flag,
            status,
            uptime: overallUptime,
            ping,
            history,
          };
        });

        let totalUptimeSum = panelUptime;
        for (const n of nodesData) totalUptimeSum += n.uptime;
        const globalUptime = Number((totalUptimeSum / (nodesData.length + 1)).toFixed(2));

        const panelCacheData = pingsData[0];
        const panelPing = panelCacheData ? panelCacheData.ping : null;
        const panelStatus = (panelPing !== -1 && panelPing !== null) ? 'Operational' : 'Major Outage';

        return {
          globalUptime,
          panel: {
            status: panelStatus,
            uptime: panelUptime,
            ping: panelPing,
            history: panelHistory,
          },
          nodes: nodesData,
        };
      }, 30);
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Failed to fetch status data', 500, 'ERR_STATUS_FETCH_FAILED');
    }
  }
}

module.exports = new StatusService();
