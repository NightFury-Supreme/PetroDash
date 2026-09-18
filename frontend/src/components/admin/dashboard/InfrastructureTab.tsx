import React from "react";
import { Server, Globe2, HardDrive } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import { COLORS, Metric, PanelHeader, Legend, ChartTooltip, DistributionPanel } from "./AdminDashboardComponents";

export function InfrastructureTab({ stats, currency, range }: any) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 border-y border-white/[0.06] divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        <Metric icon={<Server size={15} />} label="Total servers" value={stats.metrics?.activeServers?.toLocaleString() || "0"} detail="all servers" trend={stats.metrics?.serversTrend} />
        <Metric icon={<Server size={15} />} label="Deleted servers" value={stats.metrics?.deletedServers?.toLocaleString() || "0"} detail={"last " + range} trend={stats.metrics?.deletedServersTrend} negative={true} />
        <Metric icon={<Globe2 size={15} />} label="Locations" value={stats.metrics?.locationsCount?.toLocaleString() || "0"} detail="configured" trend="+0%" />
        <Metric icon={<HardDrive size={15} />} label="Eggs" value={stats.metrics?.eggsCount?.toLocaleString() || "0"} detail="configured eggs" trend="+0%" />
      </section>
      
      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <PanelHeader kicker="SERVER LIFECYCLE" title="Server growth" description="Created versus deleted servers." />
        <div className="flex flex-wrap gap-4 mt-4">
          <Legend label="Created" color={COLORS.primary} />
          <Legend label="Deleted" color={COLORS.red} />
        </div>
        <div className="h-[330px] mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.infrastructureData || []}>
              <CartesianGrid stroke="#1b1b1b" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Line type="monotone" dataKey="created" name="Created" stroke={COLORS.primary} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="deleted" name="Deleted" stroke={COLORS.red} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <PanelHeader kicker="EGG ACTIVITY" title="Egg usage over time" description="Every configured egg is plotted independently." />
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
        <DistributionPanel kicker="BY LOCATION" title="Server locations" description="Current distribution." items={stats.locations || []} icon={<Globe2 size={14} />} />
        <DistributionPanel kicker="BY EGG" title="Egg distribution" description="Every egg currently in use." items={stats.eggDistribution || []} icon={<HardDrive size={14} />} />
      </section>
    </div>
  );
}
