import React from "react";
import { DollarSign, CreditCard, WalletCards, RefreshCw } from "lucide-react";
import { ResponsiveContainer, LineChart, AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import { COLORS, Metric, PanelHeader, Legend, ChartTooltip, PlanTable } from "./AdminDashboardComponents";

export function RevenueTab({ stats, currency, range }: any) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 border-y border-white/[0.06] divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        <Metric icon={<DollarSign size={15} />} label="Total revenue" value={`${(stats.metrics?.totalRevenue || 0).toLocaleString()} ${currency}`} detail="all-time gross" trend={stats.metrics?.revenueTrend} />
        <Metric icon={<CreditCard size={15} />} label="Plan purchases" value={stats.metrics?.totalPlanPurchases?.toLocaleString() || "0"} detail="completed purchases" trend={stats.metrics?.purchasesTrend} />
        <Metric icon={<WalletCards size={15} />} label="Average order" value={`${(stats.metrics?.avgOrder || 0).toFixed(2)} ${currency}`} detail="per purchase" trend={stats.metrics?.avgOrderTrend} />
        <Metric icon={<RefreshCw size={15} />} label="Refunds" value={`${stats.metrics?.refunds || 0} ${currency}`} detail={"last " + range} trend={stats.metrics?.refundsTrend} negative={true} />
      </section>

      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <PanelHeader kicker="INCOME" title="Revenue over time" description="Gross revenue, purchases and refunds." />
        <div className="flex flex-wrap gap-4 mt-4">
          <Legend label="Revenue" color={COLORS.primary} />
          <Legend label="Refunds" color={COLORS.red} />
          <Legend label="Purchases" color={COLORS.blue} />
        </div>
        <div className="h-[330px] mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.financialData || []}>
              <CartesianGrid stroke="#1b1b1b" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} tickFormatter={(v: number) => `${v} ${currency || ''}`.trim()} />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.primary} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="refunds" name="Refunds" stroke={COLORS.red} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="purchases" name="Purchases" stroke={COLORS.blue} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <PanelHeader kicker="PLAN SALES" title="Purchased plans" description="Each subscription plan is plotted separately." />
        <div className="flex flex-wrap gap-4 mt-4">
          {(stats.planRevenueData || []).map((p: any, i: number) => (
            <Legend key={p.name} label={p.name} color={Object.values(COLORS)[i % Object.values(COLORS).length]} />
          ))}
        </div>
        <div className="h-[330px] mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.planPurchaseData || []}>
              <CartesianGrid stroke="#1b1b1b" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              {(stats.planRevenueData || []).map((p: any, i: number) => (
                <Area key={p.name} type="monotone" dataKey={p.name} name={p.name} stroke={Object.values(COLORS)[i % Object.values(COLORS).length]} fill={Object.values(COLORS)[i % Object.values(COLORS).length]} fillOpacity=".08" strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-white/[0.06] divide-y divide-white/[0.06] lg:divide-y-0">
        <div className="flex flex-col p-6 lg:border-r lg:border-white/[0.06] last:border-r-0">
          <PanelHeader kicker="PLAN BREAKDOWN" title="Purchased plans" description="Purchase count and revenue by plan." />
            <PlanTable planRevenueData={stats.planRevenueData || []} currency={currency} />
        </div>
        <div className="flex flex-col p-6 lg:border-r lg:border-white/[0.06] last:border-r-0">
          <PanelHeader kicker="PLAN REVENUE" title="Revenue by plan" description="Which plans contribute the most income." />
          <div className="h-[250px] mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.planRevenueData || []}>
                <CartesianGrid stroke="#1b1b1b" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 9 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 9 }} tickFormatter={(v: number) => `${v} ${currency || ''}`.trim()} />
                <Tooltip content={<ChartTooltip currency={currency} />} />
                <Bar dataKey="revenue" name="Revenue" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
