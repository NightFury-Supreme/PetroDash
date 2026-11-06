const { getOrSetCache, setCache, deleteCache } = require('../../../lib/redis');
const { fetchPrevData, fetchAggregateData } = require('./stats.queries');

const COLORS = {
  primary: "#ff5a1f", blue: "#4d91ff", green: "#16c784", yellow: "#e0a900",
  red: "#ef514b", purple: "#a875ff", cyan: "#37c6d0", muted: "#666666",
};

const calcTrend = (curr, prev) => {
  if (prev === 0) return curr > 0 ? '+100%' : '0%';
  const diff = curr - prev;
  const pct = Math.round((diff / prev) * 100);
  return (pct > 0 ? '+' : '') + pct + '%';
};

const formatMs = (ms) => {
  if (!ms) return 'N/A';
  const min = Math.round(ms / 60000);
  if (min < 60) return min + 'm';
  const h = (min / 60).toFixed(1);
  if (h < 24) return h + 'h';
  const d = (h / 24).toFixed(1);
  return d + 'd';
};

const buildStatsData = async (days) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);

  const prevData = await fetchPrevData(prevStartDate, startDate);
  const {
    prevUsers, prevServers, prevRevenue, prevRefunds, prevPurchases,
    prevDelUsers, prevReferrals, prevActivePlans, prevDelServers,
    prevTotalTickets, prevOpenTickets, prevPendingTickets, prevResolvedTickets,
    currReferrals, currActivePlans, currTotalTickets, currOpenTickets,
    currPendingTickets, currResolvedTickets,
  } = prevData;

  const [
    totalUsers, totalServers, eggsCount, locationsCount, 
    ticketCounts, serversByEgg, serversByLocation,
    userChartData, serverChartData, 
    serverDelData, accountDelData,
    ticketCreatedData, ticketResolvedData, ticketClosedData, ticketReopenedData, referralChartData,
    revenueMetrics, planPurchasesAgg, eggGrowthAgg, periodPlanRevenue, allTimePayments,
    activePlans, referralsTotal, avgResAgg, avgRespAgg, dailyResAgg, dailyRespAgg,
    newLocations, newEggs
  ] = await fetchAggregateData(startDate);

  const formatChart = (data) => new Map(data.map(d => [d._id, d.count]));
  const uMap = formatChart(userChartData);
  const sMap = formatChart(serverChartData);
  const sdMap = formatChart(serverDelData);
  const adMap = formatChart(accountDelData);
  const tcMap = formatChart(ticketCreatedData);
  const trMap = formatChart(ticketResolvedData);
  const tclMap = formatChart(ticketClosedData);
  const treMap = formatChart(ticketReopenedData);
  const refMap = formatChart(referralChartData);

  const revMap = new Map(revenueMetrics.map(d => [d._id.date, { rev: d.revenue, ref: d.refunds, pur: d.purchases }]));

  const planNames = Array.from(new Set(planPurchasesAgg.map(d => d._id.planName).filter(Boolean)));
  const eggNames = Array.from(new Set(eggGrowthAgg.map(d => d._id.eggName).filter(Boolean)));

  const planAggMap = new Map();
  planPurchasesAgg.forEach(d => {
    if (!d._id.planName) return;
    const key = `${d._id.date}_${d._id.planName}`;
    planAggMap.set(key, d.count);
  });

  const eggAggMap = new Map();
  eggGrowthAgg.forEach(d => {
    if (!d._id.eggName) return;
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
    const trec = treMap.get(dateStr) || 0;
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
    ticketData.push({ day: displayDay, created: tcc, resolved: trc, closed: tclc, reopened: trec });
    
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
      response: Math.round(avgRespDaily / 60000),
      resolution: Math.round(avgResDaily / 60000)
    });
  }

  const eggDistribution = serversByEgg.map(e => ({
    name: e.name || 'Unknown',
    servers: e.count,
    percentage: totalServers > 0 ? Math.round((e.count / totalServers) * 100) : 0
  }));

  const locations = serversByLocation.map(l => ({
    name: l.name || 'Unknown',
    servers: l.count,
    percentage: totalServers > 0 ? Math.round((l.count / totalServers) * 100) : 0
  }));

  const globalRevTotal = allTimePayments?.[0]?.total || 0;
  const globalPurchasesTotal = allTimePayments?.[0]?.count || 0;

  const planRevenueData = periodPlanRevenue.map(p => ({
    name: p._id || 'Unknown',
    purchases: p.purchases,
    revenue: p.revenue,
    percentage: totalRevenueAmount > 0 ? Math.round((p.revenue / totalRevenueAmount) * 100) : 0
  }));

  const openTickets = ticketCounts.find(t => t._id === 'open')?.count || 0;
  const pendingTickets = ticketCounts.find(t => t._id === 'pending')?.count || 0;
  const resolvedTickets = ticketCounts.find(t => t._id === 'resolved')?.count || 0;
  const closedTickets = ticketCounts.find(t => t._id === 'closed')?.count || 0;
  const totalTickets = openTickets + pendingTickets + resolvedTickets + closedTickets;

  const ticketLifecycle = [
    { name: "Open", status: "open", value: openTickets, color: COLORS.green },
    { name: "Pending", status: "pending", value: pendingTickets, color: COLORS.yellow },
    { name: "Resolved", status: "resolved", value: resolvedTickets, color: COLORS.blue },
    { name: "Closed", status: "closed", value: closedTickets, color: COLORS.muted },
  ];

  const createdServersInPeriod = serverChartData.reduce((acc, d) => acc + d.count, 0);

  const _usersTrend = calcTrend(totalNewUsers, prevUsers);
  const _serversTrend = calcTrend(createdServersInPeriod, prevServers);
  const _revenueTrend = calcTrend(totalRevenueAmount, prevRevenue);
  const _purchasesTrend = calcTrend(totalPurchases, prevPurchases);
  const _delAccountsTrend = calcTrend(totalDeletedUsers, prevDelUsers);
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
  const _locationsTrend = calcTrend(locationsCount, Math.max(0, locationsCount - newLocations));
  const _eggsTrend = calcTrend(eggsCount, Math.max(0, eggsCount - newEggs));

  const avgResolutionMs = avgResAgg?.[0]?.avgRes || 0;
  const avgResponseMs = avgRespAgg?.[0]?.avgResp || 0;

  return {
    metrics: {
      totalUsers: totalNewUsers, periodUsers: totalNewUsers, allTimeUsers: totalUsers, usersTrend: _usersTrend,
      activeServers: createdServersInPeriod, periodServers: createdServersInPeriod, allTimeServers: totalServers, serversTrend: _serversTrend,
      totalRevenue: totalRevenueAmount, revenueTrend: _revenueTrend, allTimeRevenue: globalRevTotal,
      totalPlanPurchases: totalPurchases, purchasesTrend: _purchasesTrend, allTimePurchases: globalPurchasesTotal,
      deletedAccounts: totalDeletedUsers, deletedAccountsTrend: _delAccountsTrend,
      referrals: currReferrals, periodReferrals: currReferrals, allTimeReferrals: referralsTotal, referralsTrend: _referralsTrend,
      activePlans: currActivePlans, periodActivePlans: currActivePlans, allTimeActivePlans: activePlans, activePlansTrend: _activePlansTrend,
      deletedServers: totalDeletedServers, deletedServersTrend: _delServersTrend,
      locationsCount, locationsTrend: _locationsTrend,
      eggsCount, eggsTrend: _eggsTrend,
      avgOrder: totalPurchases > 0 ? Math.round(totalRevenueAmount / totalPurchases) : 0, avgOrderTrend: _avgOrderTrend,
      refunds: totalRefundsAmount, refundsTrend: _refundsTrend,
      totalTickets: currTotalTickets, periodTickets: currTotalTickets, allTimeTickets: totalTickets, totalTicketsTrend: _totalTicketsTrend,
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
};

exports.getStats = async (rangeParam, forceRefresh = false) => {
  const days = rangeParam === '30D' ? 30 : (rangeParam === '14D' ? 14 : 7);
  const cacheKey = `admin:stats:${days}`;

  const fetcher = () => buildStatsData(days);

  if (forceRefresh) {
    const fresh = await fetcher();
    await setCache(cacheKey, fresh, 300);
    return fresh;
  }

  return getOrSetCache(cacheKey, fetcher, 300);
};

exports.clearStatsCache = async () => {
  await Promise.all([
    deleteCache('admin:stats:7'),
    deleteCache('admin:stats:14'),
    deleteCache('admin:stats:30'),
  ]);
};
