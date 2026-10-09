import React from "react";
import { Users, Server, DollarSign, CreditCard, Globe2, HardDrive } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import { COLORS, Metric, PanelHeader, Legend, ChartTooltip, DistributionPanel } from "./AdminDashboardComponents";

export function OverviewTab({ stats, currency }: any) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 border-y border-white/[0.06] divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        <Metric icon={<Users size={15} />} label="Total users" value={stats.metrics?.totalUsers?.toLocaleString() || "0"} detail="registered accounts" trend={stats.metrics?.usersTrend} />
        <Metric icon={<Server size={15} />} label="Active servers" value={stats.metrics?.activeServers?.toLocaleString() || "0"} detail="currently running" trend={stats.metrics?.serversTrend} />
        <Metric icon={<DollarSign size={15} />} label="Revenue" value={`${(stats.metrics?.totalRevenue || 0).toLocaleString()} ${currency}`} detail="all-time" trend={stats.metrics?.revenueTrend} />
        <Metric icon={<CreditCard size={15} />} label="Purchases" value={stats.metrics?.totalPlanPurchases?.toLocaleString() || "0"} detail="completed orders" trend={stats.metrics?.purchasesTrend} />
      </section>
      
      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <PanelHeader kicker="PLATFORM PERFORMANCE" title="Platform activity" description="Users, servers, purchases and revenue." />
        <div className="flex flex-wrap gap-4 mt-4">
          <Legend label="Users" color={COLORS.primary} />
          <Legend label="Servers" color={COLORS.blue} />
          <Legend label="Purchases" color={COLORS.green} />
          <Legend label="Revenue" color={COLORS.yellow} />
        </div>
        <div className="h-[330px] mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.overviewData || []}>
              <CartesianGrid stroke="#1b1b1b" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Line type="monotone" dataKey="users" name="Users" stroke={COLORS.primary} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="servers" name="Servers" stroke={COLORS.blue} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="purchases" name="Purchases" stroke={COLORS.green} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.yellow} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      
      <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-white/[0.06] divide-y divide-white/[0.06] lg:divide-y-0">
        <DistributionPanel kicker="RESOURCE USAGE" title="Server locations" description="Current server distribution." items={stats.locations || []} icon={<Globe2 size={14} />} />
        <DistributionPanel kicker="SERVER DISTRIBUTION" title="Egg usage" description="Servers grouped by egg." items={stats.eggDistribution || []} icon={<HardDrive size={14} />} />
      </section>
    </div>
  );
}
