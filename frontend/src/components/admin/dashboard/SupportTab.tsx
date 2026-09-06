import React from "react";
import { Ticket, MessageSquare, Clock3, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, PieChart, Pie, Cell } from "recharts";
import { COLORS, Metric, PanelHeader, Legend, ChartTooltip } from "./AdminDashboardComponents";

export function SupportTab({ stats, currency }: any) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 border-y border-white/[0.06] divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        <Metric icon={<Ticket size={15} />} label="Total tickets" value={stats.metrics?.totalTickets?.toLocaleString() || "0"} detail="all tickets" trend={stats.metrics?.totalTicketsTrend} />
        <Metric icon={<MessageSquare size={15} />} label="Open" value={stats.metrics?.openTickets?.toLocaleString() || "0"} detail="awaiting support" trend={stats.metrics?.openTicketsTrend} negative={true} />
        <Metric icon={<Clock3 size={15} />} label="Pending" value={stats.metrics?.pendingTickets?.toLocaleString() || "0"} detail="waiting for action" trend={stats.metrics?.pendingTicketsTrend} />
        <Metric icon={<CheckCircle2 size={15} />} label="Resolved" value={stats.metrics?.resolvedTickets?.toLocaleString() || "0"} detail="awaiting closure" trend={stats.metrics?.resolvedTicketsTrend} />
      </section>

      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <PanelHeader kicker="TICKET LIFECYCLE" title="Support activity" description="Created, resolved, closed and reopened tickets." />
        <div className="flex flex-wrap gap-4 mt-4">
          <Legend label="Created" color={COLORS.primary} />
          <Legend label="Resolved" color={COLORS.blue} />
          <Legend label="Closed" color={COLORS.green} />
          <Legend label="Reopened" color={COLORS.yellow} />
        </div>
        <div className="h-[330px] mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.ticketData || []}>
              <CartesianGrid stroke="#1b1b1b" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 10 }} />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Area type="monotone" dataKey="created" name="Created" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity=".08" strokeWidth={2} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke={COLORS.blue} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="closed" name="Closed" stroke={COLORS.green} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="reopened" name="Reopened" stroke={COLORS.yellow} strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-white/[0.06] divide-y divide-white/[0.06] lg:divide-y-0">
        <div className="flex flex-col p-6 lg:border-r lg:border-white/[0.06] last:border-r-0">
          <PanelHeader kicker="CURRENT STATE" title="Ticket distribution" description="Current status breakdown." />
          <div className="flex flex-col sm:flex-row items-center gap-8 mt-4">
            <div className="relative h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.ticketLifecycle || []} dataKey="value" innerRadius={58} outerRadius={80} paddingAngle={3} stroke="none">
                    {(stats.ticketLifecycle || []).map((item: any) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <strong className="text-2xl font-semibold text-[#eee]">{stats.metrics?.totalTickets || 0}</strong>
                <span>tickets</span>
              </div>
            </div>
            <div className="flex w-full flex-col gap-4">
              {(stats.ticketLifecycle || []).map((item: any) => (
                <div className="flex justify-between text-xs text-[#888]" key={item.name}>
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: item.color }} /><span>{item.name}</span></div>
                  <strong className="text-[#ccc]">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col p-6 lg:border-r lg:border-white/[0.06] last:border-r-0">
          <PanelHeader kicker="SUPPORT PERFORMANCE" title="Response & resolution" description="Average support handling time." />
          <div className="flex gap-12 mt-4 mb-2">
            <div className="flex flex-col gap-1"><span className="text-[10px] font-medium uppercase tracking-widest text-[#555]">FIRST RESPONSE</span><strong className="text-3xl tracking-tight text-[#eee]">{stats.metrics?.avgResponseTime || 'N/A'}</strong></div>
            <div className="flex flex-col gap-1"><span className="text-[10px] font-medium uppercase tracking-widest text-[#555]">AVG. RESOLUTION</span><strong className="text-3xl tracking-tight text-[#eee]">{stats.metrics?.avgResolutionTime || 'N/A'}</strong></div>
          </div>
          <div className="h-[190px] mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.responseData || []}>
                <CartesianGrid stroke="#1b1b1b" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 9 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#555", fontSize: 9 }} tickFormatter={(v: number) => v >= 60 ? `${(v / 60).toFixed(0)}h` : `${v}m`} />
                <Tooltip content={<ChartTooltip currency={currency} />} />
                <Line type="monotone" dataKey="response" name="First response" stroke={COLORS.primary} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="resolution" name="Resolution" stroke={COLORS.blue} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
