import React from "react";
import { Users, Server, DollarSign, CreditCard, Globe2, HardDrive } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import { useTranslations } from "next-intl";
import { COLORS, Metric, PanelHeader, Legend, ChartTooltip, DistributionPanel } from "./AdminDashboardComponents";

export function OverviewTab({ stats, currency }: any) {
  const t = useTranslations('admin.dashboard');

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 border-y border-white/[0.06] divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        <Metric icon={<Users size={15} />} label={t('metrics.totalUsers')} value={stats.metrics?.totalUsers?.toLocaleString() || "0"} detail={t('metrics.registeredAccounts')} trend={stats.metrics?.usersTrend} />
        <Metric icon={<Server size={15} />} label={t('metrics.activeServers')} value={stats.metrics?.activeServers?.toLocaleString() || "0"} detail={t('metrics.currentlyRunning')} trend={stats.metrics?.serversTrend} />
        <Metric icon={<DollarSign size={15} />} label={t('metrics.revenue')} value={`${(stats.metrics?.totalRevenue || 0).toLocaleString()} ${currency}`} detail={t('metrics.allTime')} trend={stats.metrics?.revenueTrend} />
        <Metric icon={<CreditCard size={15} />} label={t('metrics.purchases')} value={stats.metrics?.totalPlanPurchases?.toLocaleString() || "0"} detail={t('metrics.completedOrders')} trend={stats.metrics?.purchasesTrend} />
      </section>
      
      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <PanelHeader kicker={t('performance.kicker')} title={t('performance.title')} description={t('performance.description')} />
        <div className="flex flex-wrap gap-4 mt-4">
          <Legend label={t('legends.users')} color={COLORS.primary} />
          <Legend label={t('legends.servers')} color={COLORS.blue} />
          <Legend label={t('legends.purchases')} color={COLORS.green} />
          <Legend label={t('legends.revenue')} color={COLORS.yellow} />
        </div>
        <div className="h-[330px] mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.overviewData || []}>
              <CartesianGrid stroke="#1b1b1b" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Line type="monotone" dataKey="users" name={t('legends.users')} stroke={COLORS.primary} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="servers" name={t('legends.servers')} stroke={COLORS.blue} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="purchases" name={t('legends.purchases')} stroke={COLORS.green} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="revenue" name={t('legends.revenue')} stroke={COLORS.yellow} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      
      <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-white/[0.06] divide-y divide-white/[0.06] lg:divide-y-0">
        <DistributionPanel kicker={t('locations.kicker')} title={t('locations.title')} description={t('locations.description')} items={stats.locations || []} icon={<Globe2 size={14} />} />
        <DistributionPanel kicker={t('eggs.kicker')} title={t('eggs.title')} description={t('eggs.description')} items={stats.eggDistribution || []} icon={<HardDrive size={14} />} />
      </section>
    </div>
  );
}
