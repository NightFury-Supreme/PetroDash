import React from "react";
import { Users, UserRound, TrendingUp, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import { COLORS, Metric, PanelHeader, Legend, ChartTooltip } from "./AdminDashboardComponents";

export function UsersTab({ stats, currency, range }: any) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 border-y border-white/[0.06] divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        <Metric icon={<Users size={15} />} label="Total users" value={stats.metrics?.totalUsers?.toLocaleString() || "0"} detail="registered accounts" trend={stats.metrics?.usersTrend} />
        <Metric icon={<UserRound size={15} />} label="Deleted accounts" value={stats.metrics?.deletedAccounts?.toLocaleString() || "0"} detail={"last " + range} trend={stats.metrics?.deletedAccountsTrend} negative={true} />
        <Metric icon={<TrendingUp size={15} />} label="Referrals" value={stats.metrics?.referrals?.toLocaleString() || "0"} detail="all-time referrals" trend={stats.metrics?.referralsTrend} />
        <Metric icon={<CheckCircle2 size={15} />} label="Active plans" value={stats.metrics?.activePlans?.toLocaleString() || "0"} detail="currently active" trend={stats.metrics?.activePlansTrend} />
      </section>
      
      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <PanelHeader kicker="USER ACTIVITY" title="User growth" description="Registrations, deletions and referrals." />
        <div className="flex flex-wrap gap-4 mt-4">
          <Legend label="Registrations" color={COLORS.primary} />
          <Legend label="Deleted" color={COLORS.red} />
          <Legend label="Referrals" color={COLORS.blue} />
        </div>
        <div className="h-[330px] mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.usersData || []}>
              <CartesianGrid stroke="#1b1b1b" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Area type="monotone" dataKey="registered" name="Registrations" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity=".08" strokeWidth={2} />
              <Line type="monotone" dataKey="deleted" name="Deleted" stroke={COLORS.red} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="referrals" name="Referrals" stroke={COLORS.blue} strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
