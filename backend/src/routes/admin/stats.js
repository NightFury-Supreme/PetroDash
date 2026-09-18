const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const User = require('../../models/User');
const Server = require('../../models/Server');
const Egg = require('../../models/Egg');
const Location = require('../../models/Location');
const UserPlan = require('../../models/UserPlan');
const Ticket = require('../../models/Ticket');
const TicketMessage = require('../../models/TicketMessage');
const AuditLog = require('../../models/AuditLog');
const Payment = require('../../models/Payment');
const { getCache, setCache } = require('../../lib/redis');

const router = express.Router();

const COLORS = {
  primary: "#ff5a1f", blue: "#4d91ff", green: "#16c784", yellow: "#e0a900",
  red: "#ef514b", purple: "#a875ff", cyan: "#37c6d0", muted: "#666666",
};

router.get('/', requireAdmin, async (req, res) => {
  try {
    const rangeParam = req.query.range || '7D';
    const days = rangeParam === '30D' ? 30 : (rangeParam === '14D' ? 14 : 7);
    const cacheKey = `admin:stats:${days}`;
    
    const cachedStats = await getCache(cacheKey);
    if (cachedStats) return res.json(cachedStats);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    
    const prevData = await Promise.all([
      User.countDocuments({ createdAt: { $gte: prevStartDate, $lt: startDate } }),
      // [1] Active servers created in the previous period (for trend denominator)
      Server.countDocuments({ status: 'active', createdAt: { $gte: prevStartDate, $lt: startDate } }),
      Payment.aggregate([
        { $match: { createdAt: { $gte: prevStartDate, $lt: startDate } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: { $cond: [ { $eq: ["$status", "COMPLETED"] }, "$amount", 0 ] } },
            refunds: { $sum: { $cond: [ { $eq: ["$status", "REFUNDED"] }, "$amount", 0 ] } },
            purchases: { $sum: { $cond: [ { $eq: ["$status", "COMPLETED"] }, 1, 0 ] } }
          }
        }
      ]),
      AuditLog.countDocuments({ action: 'admin.user.delete', createdAt: { $gte: prevStartDate, $lt: startDate } }),
      User.countDocuments({ referredBy: { $ne: null }, createdAt: { $gte: prevStartDate, $lt: startDate } }),
      UserPlan.countDocuments({ status: 'active', createdAt: { $gte: prevStartDate, $lt: startDate } }),
      AuditLog.countDocuments({ action: 'server.delete', createdAt: { $gte: prevStartDate, $lt: startDate } }),
      Ticket.countDocuments({ createdAt: { $gte: prevStartDate, $lt: startDate } }),
      Ticket.countDocuments({ status: 'open', createdAt: { $gte: prevStartDate, $lt: startDate } }),
      Ticket.countDocuments({ status: 'pending', createdAt: { $gte: prevStartDate, $lt: startDate } }),
      Ticket.countDocuments({ status: 'resolved', createdAt: { $gte: prevStartDate, $lt: startDate } }),
      // Current period counts (for same-metric comparison)
      User.countDocuments({ referredBy: { $ne: null }, createdAt: { $gte: startDate } }),
      UserPlan.countDocuments({ status: 'active', createdAt: { $gte: startDate } }),
      Ticket.countDocuments({ createdAt: { $gte: startDate } }),
      Ticket.countDocuments({ status: 'open', createdAt: { $gte: startDate } }),
      Ticket.countDocuments({ status: 'pending', createdAt: { $gte: startDate } }),
      Ticket.countDocuments({ status: 'resolved', createdAt: { $gte: startDate } }),
      // [17] Active servers created in the current period (for trend numerator)
      Server.countDocuments({ status: 'active', createdAt: { $gte: startDate } }),
    ]);
    const prevActiveServers = prevData[1] || 0;
    const prevRevenue = prevData[2][0]?.revenue || 0;
    const prevRefunds = prevData[2][0]?.refunds || 0;
    const prevPurchases = prevData[2][0]?.purchases || 0;
    const prevDelUsers = prevData[3] || 0;
    const prevReferrals = prevData[4] || 0;
    const prevActivePlans = prevData[5] || 0;
    const prevDelServers = prevData[6] || 0;
    const prevTotalTickets = prevData[7] || 0;
    const prevOpenTickets = prevData[8] || 0;
    const prevPendingTickets = prevData[9] || 0;
    const prevResolvedTickets = prevData[10] || 0;
    // Current period counts
    const currReferrals = prevData[11] || 0;
    const currActivePlans = prevData[12] || 0;
    const currTotalTickets = prevData[13] || 0;
    const currOpenTickets = prevData[14] || 0;
    const currPendingTickets = prevData[15] || 0;
    const currResolvedTickets = prevData[16] || 0;
    const currActiveServers = prevData[17] || 0;

    const [
      totalUsers, totalServers, eggsCount, locationsCount, 
      ticketCounts, serversByEgg, serversByLocation,
      userChartData, serverChartData, 
      serverDelData, accountDelData,
      ticketCreatedData, ticketResolvedData, ticketClosedData, referralChartData,
      revenueMetrics, planPurchasesAgg, eggGrowthAgg, globalPlanRevenue,
      activePlans, referralsTotal, avgResAgg, avgRespAgg, dailyResAgg, dailyRespAgg
    ] = await Promise.all([
      User.countDocuments({}),
      Server.countDocuments({ status: 'active' }),
      Egg.countDocuments({}),
      Location.countDocuments({}),
      Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      
      Server.aggregate([
        { $group: { _id: '$eggId', count: { $sum: 1 } } },
        { $lookup: { from: 'eggs', localField: '_id', foreignField: '_id', as: 'egg' } },
        { $unwind: { path: '$egg', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, eggId: '$_id', name: '$egg.name', count: 1 } }
      ]),
      
      Server.aggregate([
        { $group: { _id: '$locationId', count: { $sum: 1 } } },
        { $lookup: { from: 'locations', localField: '_id', foreignField: '_id', as: 'location' } },
        { $unwind: { path: '$location', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, locationId: '$_id', name: '$location.name', count: 1 } }
      ]),

      User.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }]),
      Server.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }]),
      AuditLog.aggregate([{ $match: { action: 'server.delete', createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }]),
      AuditLog.aggregate([{ $match: { action: 'admin.user.delete', createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $match: { status: 'resolved', updatedAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $match: { status: 'closed', closedAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$closedAt" } }, count: { $sum: 1 } } }]),
      User.aggregate([{ $match: { referredBy: { $ne: null }, createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }]),

      // 16: revenueMetrics (from Payments)
      Payment.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } },
            revenue: { $sum: { $cond: [ { $eq: ["$status", "COMPLETED"] }, "$amount", 0 ] } },
            refunds: { $sum: { $cond: [ { $eq: ["$status", "REFUNDED"] }, "$amount", 0 ] } },
            purchases: { $sum: { $cond: [ { $eq: ["$status", "COMPLETED"] }, 1, 0 ] } }
          }
        }
      ]),

      // 17: planPurchasesAgg (UserPlan joined with Plan)
      UserPlan.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $lookup: { from: 'plans', localField: 'planId', foreignField: '_id', as: 'plan' } },
        { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              planName: "$plan.name"
            },
            count: { $sum: 1 }
          }
        }
      ]),

      // 18: eggGrowthAgg (Server joined with Egg)
      Server.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $lookup: { from: 'eggs', localField: 'eggId', foreignField: '_id', as: 'egg' } },
        { $unwind: { path: '$egg', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              eggName: "$egg.name"
            },
            count: { $sum: 1 }
          }
        }
      ]),

      // 19: globalPlanRevenue
      Payment.aggregate([
        { $match: { status: 'COMPLETED' } },
        { $lookup: { from: 'plans', localField: 'planId', foreignField: '_id', as: 'plan' } },
        { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$plan.name",
            purchases: { $sum: 1 },
            revenue: { $sum: "$amount" }
          }
        }
      ]),

      // 21: activePlans (REAL)
      UserPlan.countDocuments({ status: 'active' }),
      // 22: referralsTotal (REAL)
      User.countDocuments({ referredBy: { $ne: null } }),
      // 23: avg resolution
      Ticket.aggregate([
        { $match: { status: { $in: ['resolved', 'closed'] } } },
        { $project: { duration: { $subtract: ['$updatedAt', '$createdAt'] } } },
        { $group: { _id: null, avgRes: { $avg: '$duration' } } }
      ]),
      // 24: avg first response
      TicketMessage.aggregate([
        { $match: { authorRole: 'admin' } },
        { $sort: { createdAt: 1 } },
        { $group: { _id: '$ticket', firstReplyAt: { $first: '$createdAt' } } },
        { $lookup: { from: 'tickets', localField: '_id', foreignField: '_id', as: 't' } },
        { $unwind: '$t' },
        { $project: { duration: { $subtract: ['$firstReplyAt', '$t.createdAt'] } } },
        { $group: { _id: null, avgResp: { $avg: '$duration' } } }
      ]),
      // 25: daily avg resolution
      Ticket.aggregate([
        { $match: { status: { $in: ['resolved', 'closed'] }, updatedAt: { $gte: startDate } } },
        { $project: { day: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, duration: { $subtract: ['$updatedAt', '$createdAt'] } } },
        { $group: { _id: '$day', avgRes: { $avg: '$duration' } } }
      ]),
      // 26: daily avg first response
      TicketMessage.aggregate([
        { $match: { authorRole: 'admin', createdAt: { $gte: startDate } } },
        { $sort: { createdAt: 1 } },
        { $group: { _id: '$ticket', firstReplyAt: { $first: '$createdAt' } } },
        { $lookup: { from: 'tickets', localField: '_id', foreignField: '_id', as: 't' } },
        { $unwind: '$t' },
        { $project: { day: { $dateToString: { format: "%Y-%m-%d", date: "$firstReplyAt" } }, duration: { $subtract: ['$firstReplyAt', '$t.createdAt'] } } },
        { $group: { _id: '$day', avgResp: { $avg: '$duration' } } }
      ])
    ]);

    const formatChart = (data) => new Map(data.map(d => [d._id, d.count]));
    const uMap = formatChart(userChartData);
    const sMap = formatChart(serverChartData);
    const sdMap = formatChart(serverDelData);
    const adMap = formatChart(accountDelData);
    const tcMap = formatChart(ticketCreatedData);
    const trMap = formatChart(ticketResolvedData);
    const tclMap = formatChart(ticketClosedData);
    const refMap = formatChart(referralChartData);

    const revMap = new Map(revenueMetrics.map(d => [d._id.date, { rev: d.revenue, ref: d.refunds, pur: d.purchases }]));

    const planNames = Array.from(new Set(planPurchasesAgg.map(d => d._id.planName).filter(Boolean)));
    const eggNames = Array.from(new Set(eggGrowthAgg.map(d => d._id.eggName).filter(Boolean)));

    const planAggMap = new Map();
    planPurchasesAgg.forEach(d => {
      if(!d._id.planName) return;
      const key = `${d._id.date}_${d._id.planName}`;
      planAggMap.set(key, d.count);
    });

    const eggAggMap = new Map();
    eggGrowthAgg.forEach(d => {
      if(!d._id.eggName) return;
      const key = `${d._id.date}_${d._id.eggName}`;
      eggAggMap.set(key, d.count);
    });

    const overviewData = [];
    const usersData = [];
    const financialData = [];
    const planPurchaseData = [];
    const infrastructureData = [];
    const eggGrowthData = [];
    const ticketData = [];
    const responseData = [];

    let totalNewUsers = 0;
    let totalDeletedServers = 0;
    let totalDeletedUsers = 0;
    let totalPurchases = 0;
    let totalRevenueAmount = 0;
    let totalRefundsAmount = 0;

    const dailyResMap = new Map(dailyResAgg.map(d => [d._id, d.avgRes]));
    const dailyRespMap = new Map(dailyRespAgg.map(d => [d._id, d.avgResp]));

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const uc = uMap.get(dateStr) || 0;
      const sc = sMap.get(dateStr) || 0;
      const sdc = sdMap.get(dateStr) || 0;
      const adc = adMap.get(dateStr) || 0;
      const tcc = tcMap.get(dateStr) || 0;
      const trc = trMap.get(dateStr) || 0;
      const tclc = tclMap.get(dateStr) || 0;
      const refc = refMap.get(dateStr) || 0;

      const rData = revMap.get(dateStr) || { rev: 0, ref: 0, pur: 0 };

      totalNewUsers += uc;
      totalDeletedServers += sdc;
      totalDeletedUsers += adc;
      totalPurchases += rData.pur;
      totalRevenueAmount += rData.rev;
      totalRefundsAmount += rData.ref;

      overviewData.push({ day: displayDay, users: uc, servers: sc, purchases: rData.pur, revenue: rData.rev });
      usersData.push({ day: displayDay, registered: uc, deleted: adc, referrals: refc });
      financialData.push({ day: displayDay, revenue: rData.rev, purchases: rData.pur, refunds: rData.ref });
      infrastructureData.push({ day: displayDay, created: sc, deleted: sdc });
      ticketData.push({ day: displayDay, created: tcc, resolved: trc, closed: tclc, reopened: 0 });
      
      const ppDay = { day: displayDay };
      planNames.forEach(pn => {
        ppDay[pn] = planAggMap.get(`${dateStr}_${pn}`) || 0;
      });
      planPurchaseData.push(ppDay);

      const eggDay = { day: displayDay };
      eggNames.forEach(en => {
        eggDay[en] = eggAggMap.get(`${dateStr}_${en}`) || 0;
      });
      eggGrowthData.push(eggDay);
      
      const avgResDaily = dailyResMap.get(dateStr) || 0;
      const avgRespDaily = dailyRespMap.get(dateStr) || 0;
      responseData.push({ 
        day: displayDay, 
        response: Math.round(avgRespDaily / 60000), // in minutes
        resolution: Math.round(avgResDaily / 60000) // in minutes
      });
    }

    const eggDistribution = serversByEgg.map(e => ({
      name: e.name || e.eggId || 'Unknown',
      servers: e.count,
      percentage: totalServers > 0 ? Math.round((e.count / totalServers) * 100) : 0
    }));

    const locations = serversByLocation.map(l => ({
      name: l.name || l.locationId || 'Unknown',
      servers: l.count,
      percentage: totalServers > 0 ? Math.round((l.count / totalServers) * 100) : 0
    }));

    let globalRevTotal = 0;
    globalPlanRevenue.forEach(p => { globalRevTotal += p.revenue; });

    const planRevenueData = globalPlanRevenue.map(p => ({
      name: p._id || 'Unknown',
      purchases: p.purchases,
      revenue: p.revenue,
      percentage: globalRevTotal > 0 ? Math.round((p.revenue / globalRevTotal) * 100) : 0
    }));

    const openTickets = ticketCounts.find(t => t._id === 'open')?.count || 0;
    const pendingTickets = ticketCounts.find(t => t._id === 'pending')?.count || 0;
    const resolvedTickets = ticketCounts.find(t => t._id === 'resolved')?.count || 0;
    const closedTickets = ticketCounts.find(t => t._id === 'closed')?.count || 0;
    const totalTickets = openTickets + pendingTickets + resolvedTickets + closedTickets;

    const ticketLifecycle = [
      { name: "Open", value: openTickets, color: COLORS.green },
      { name: "Pending", value: pendingTickets, color: COLORS.yellow },
      { name: "Resolved", value: resolvedTickets, color: COLORS.blue },
      { name: "Closed", value: closedTickets, color: COLORS.muted },
    ];

    const calcTrend = (curr, prev) => {
      if (prev === 0) return curr > 0 ? '+100%' : '0%';
      const diff = curr - prev;
      const pct = Math.round((diff / prev) * 100);
      return (pct > 0 ? '+' : '') + pct + '%';
    };

    const prevTotalUsers = totalUsers - totalNewUsers;
    // Servers trend: compare active servers gained this period vs. prev period
    const prevTotalRevenue = globalRevTotal - totalRevenueAmount;
    let globalPurchasesTotal = 0;
    globalPlanRevenue.forEach(p => { globalPurchasesTotal += p.purchases; });
    const prevTotalPurchases = globalPurchasesTotal - totalPurchases;

    const _usersTrend = calcTrend(totalUsers, prevTotalUsers);
    // Active servers: period-over-period new active servers (curr vs prev window)
    const _serversTrend = calcTrend(currActiveServers, prevActiveServers);
    const _revenueTrend = calcTrend(globalRevTotal, prevTotalRevenue);
    const _purchasesTrend = calcTrend(globalPurchasesTotal, prevTotalPurchases);

    const _delAccountsTrend = calcTrend(totalDeletedUsers, prevDelUsers);
    // New referrals this period = users who joined this period with a referral code
    const _referralsTrend = calcTrend(currReferrals, prevReferrals);
    const _activePlansTrend = calcTrend(currActivePlans, prevActivePlans);
    const _delServersTrend = calcTrend(totalDeletedServers, prevDelServers);
    const _refundsTrend = calcTrend(totalRefundsAmount, prevRefunds);
    const _totalTicketsTrend = calcTrend(currTotalTickets, prevTotalTickets);
    const _openTicketsTrend = calcTrend(currOpenTickets, prevOpenTickets);
    const _pendingTicketsTrend = calcTrend(currPendingTickets, prevPendingTickets);
    const _resolvedTicketsTrend = calcTrend(currResolvedTickets, prevResolvedTickets);
    const currAvg = totalPurchases > 0 ? totalRevenueAmount / totalPurchases : 0;
    const prevAvg = prevPurchases > 0 ? prevRevenue / prevPurchases : 0;
    const _avgOrderTrend = calcTrend(currAvg, prevAvg);

    const avgResolutionMs = avgResAgg?.[0]?.avgRes || 0;
    const avgResponseMs = avgRespAgg?.[0]?.avgResp || 0;

    const formatMs = (ms) => {
      if (!ms) return 'N/A';
      const min = Math.round(ms / 60000);
      if (min < 60) return min + 'm';
      const h = (min / 60).toFixed(1);
      if (h < 24) return h + 'h';
      const d = (h / 24).toFixed(1);
      return d + 'd';
    };

    const result = {
      metrics: {
        totalUsers, usersTrend: _usersTrend,
        activeServers: totalServers, serversTrend: _serversTrend,
        totalRevenue: globalRevTotal, revenueTrend: _revenueTrend,
        totalPlanPurchases: globalPurchasesTotal, purchasesTrend: _purchasesTrend,
        deletedAccounts: totalDeletedUsers, deletedAccountsTrend: _delAccountsTrend,
        referrals: referralsTotal, referralsTrend: _referralsTrend,
        activePlans: activePlans, activePlansTrend: _activePlansTrend,
        deletedServers: totalDeletedServers, deletedServersTrend: _delServersTrend,
        locationsCount, eggsCount,
        avgOrder: totalPurchases > 0 ? Math.round(totalRevenueAmount / totalPurchases) : 0, avgOrderTrend: _avgOrderTrend,
        refunds: totalRefundsAmount, refundsTrend: _refundsTrend,
        totalTickets, totalTicketsTrend: _totalTicketsTrend,
        openTickets, openTicketsTrend: _openTicketsTrend,
        pendingTickets, pendingTicketsTrend: _pendingTicketsTrend,
        resolvedTickets, resolvedTicketsTrend: _resolvedTicketsTrend,
        avgResponseTime: formatMs(avgResponseMs), 
        avgResolutionTime: formatMs(avgResolutionMs)
      },
      overviewData,
      usersData,
      infrastructureData,
      financialData,
      planPurchaseData,
      ticketData,
      eggGrowthData,
      responseData,
      eggDistribution,
      locations,
      planRevenueData,
      ticketLifecycle
    };

    await setCache(cacheKey, result, 60);
    return res.json(result);
  } catch (e) {
    console.error('Stats error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
