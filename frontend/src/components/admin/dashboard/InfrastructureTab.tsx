import React from "react";
import { Server, Globe2, HardDrive } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import { useTranslations } from "next-intl";
import { COLORS, Metric, PanelHeader, Legend, ChartTooltip, DistributionPanel } from "./AdminDashboardComponents";

export function InfrastructureTab({ stats, currency, range }: any) {
  const t = useTranslations('admin.dashboard');

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 border-y border-white/[0.06] divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        <Metric icon={<Server size={15} />} label={t('metrics.totalServers')} value={stats.metrics?.activeServers?.toLocaleString() || "0"} detail={t('metrics.allServers')} trend={stats.metrics?.serversTrend} />
        <Metric icon={<Server size={15} />} label={t('metrics.deletedServers')} value={stats.metrics?.deletedServers?.toLocaleString() || "0"} detail={t('metrics.lastRange', { range })} trend={stats.metrics?.deletedServersTrend} negative={true} />
        <Metric icon={<Globe2 size={15} />} label={t('metrics.locations')} value={stats.metrics?.locationsCount?.toLocaleString() || "0"} detail={t('metrics.configured')} trend="+0%" />
        <Metric icon={<HardDrive size={15} />} label={t('metrics.eggs')} value={stats.metrics?.eggsCount?.toLocaleString() || "0"} detail={t('metrics.configuredEggs')} trend="+0%" />
      </section>
      
      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <PanelHeader kicker={t('infrastructure.lifecycleKicker')} title={t('infrastructure.lifecycleTitle')} description={t('infrastructure.lifecycleDescription')} />
        <div className="flex flex-wrap gap-4 mt-4">
          <Legend label={t('legends.created')} color={COLORS.primary} />
          <Legend label={t('legends.deleted')} color={COLORS.red} />
        </div>
        <div className="h-[330px] mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.infrastructureData || []}>
              <CartesianGrid stroke="#1b1b1b" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Line type="monotone" dataKey="created" name={t('legends.created')} stroke={COLORS.primary} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="deleted" name={t('legends.deleted')} stroke={COLORS.red} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <PanelHeader kicker={t('infrastructure.eggActivityKicker')} title={t('infrastructure.eggActivityTitle')} description={t('infrastructure.eggActivityDescription')} />
        <div className="chart-legend egg-legend">
          {(stats.eggDistribution || []).slice(0, 6).map((e: any, i: number) => (
            <Legend key={e.name} label={e.name} color={Object.values(COLORS)[i % Object.values(COLORS).length]} />
          ))}
        </div>
        <div className="h-[330px] mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.eggGrowthData || []}>
              <CartesianGrid stroke="#1b1b1b" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              {(stats.eggDistribution || []).slice(0, 6).map((e: any, i: number) => (
                <Line key={e.name} type="monotone" dataKey={e.name} name={e.name} stroke={Object.values(COLORS)[i % Object.values(COLORS).length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-white/[0.06] divide-y divide-white/[0.06] lg:divide-y-0">
        <DistributionPanel kicker={t('infrastructure.byLocationKicker')} title={t('infrastructure.locationTitle')} description={t('infrastructure.locationDescription')} items={stats.locations || []} icon={<Globe2 size={14} />} />
        <DistributionPanel kicker={t('infrastructure.byEggKicker')} title={t('infrastructure.eggTitle')} description={t('infrastructure.eggDescription')} items={stats.eggDistribution || []} icon={<HardDrive size={14} />} />
      </section>
    </div>
  );
}
