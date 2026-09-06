import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export const COLORS = {
  primary: "#ff5a1f", blue: "#4d91ff", green: "#16c784", yellow: "#e0a900",
  red: "#ef514b", purple: "#a875ff", cyan: "#37c6d0", muted: "#666666",
};

export function ChartTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#333] bg-[#151515] p-3 shadow-xl flex flex-col gap-1.5 text-xs">
      <div className="text-[#888] font-medium mb-1">{label}</div>
      {payload.map((item: any) => {
        let displayVal = typeof item.value === "number" ? item.value.toLocaleString() : item.value;
        if ((item.name === "Revenue" || item.name === "Refunds") && currency) {
          displayVal = `${displayVal} ${currency}`;
        } else if (item.name === "First response" || item.name === "Resolution") {
          const val = Number(item.value);
          if (val >= 60) displayVal = `${(val / 60).toFixed(1)}h`;
          else displayVal = `${val}m`;
        }
        return (
          <div className="flex justify-between items-center gap-4 text-[#ccc]" key={item.dataKey}>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <strong className="font-semibold text-white">{displayVal}</strong>
          </div>
        );
      })}
    </div>
  );
}

export function Metric({ icon, label, value, detail, trend, negative = false }: any) {
  return (
    <div className="flex flex-col px-6 py-5 sm:border-r sm:border-white/[0.06] last:border-r-0">
      <div className="flex items-center gap-2 text-[#888] text-[10px] font-medium uppercase tracking-widest">
        <span className="text-[#555]">{icon}</span> {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-[#eee]">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className={`flex items-center gap-1 ${negative ? "text-red-400" : "text-emerald-400"}`}>
          {negative ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
          {trend}
        </span>
        <span className="text-[#666]">{detail}</span>
      </div>
    </div>
  );
}

export function Legend({ label, color }: any) {
  return (
    <div className="flex items-center gap-2 text-[#888] text-xs">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}

export function PanelHeader({ kicker, title, description }: any) {
  return (
    <div className="mb-4">
      <div className="text-[10px] font-medium uppercase tracking-widest text-[#555] mb-1">{kicker}</div>
      <h2 className="text-base font-semibold tracking-tight text-[#eee]">{title}</h2>
      <p className="text-xs text-[#888] mt-1">{description}</p>
    </div>
  );
}

export function DistributionPanel({ kicker, title, description, items, icon }: any) {
  return (
    <div className="flex flex-col p-6 lg:border-r lg:border-white/[0.06] last:border-r-0">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-[#555] mb-1">{kicker}</div>
          <h2 className="text-base font-semibold tracking-tight text-[#eee]">{title}</h2>
          <p className="text-xs text-[#888] mt-1">{description}</p>
        </div>
        <span className="text-[#555]">{icon}</span>
      </div>
        <div className="flex flex-col mt-2">
          {items?.map((item: any) => {
            const totalSegments = 100;
            const percentage = Math.min(item.percentage || 0, 100);
            const filledSegments = Math.round((percentage / 100) * totalSegments);

            return (
              <div className="mb-4 last:mb-0" key={item.name}>
                <div className="mb-1.5 flex justify-between text-[11px] font-medium">
                  <span className="text-[#AAAAAA]">{item.name}</span>
                  <span className="text-[#FF5722]">{item.servers}</span>
                </div>
                <div className="flex gap-[2px] h-2">
                  {Array.from({ length: totalSegments }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-[1px] transition-colors"
                      style={{
                        backgroundColor: i < filledSegments ? '#FF5722' : '#2A2A2A',
                        opacity: i < filledSegments ? 1 : 0.5
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
}

export function PlanTable({ planRevenueData, currency }: any) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-[1.4fr_.8fr_.9fr_.5fr] items-center border-b border-[#222] pb-3 text-[10px] font-medium uppercase tracking-widest text-[#555]">
        <span>PLAN</span><span>PURCHASES</span><span>REVENUE</span><span>SHARE</span>
      </div>
      <div className="flex flex-col">
        {planRevenueData?.map((plan: any) => (
          <div className="grid grid-cols-[1.4fr_.8fr_.9fr_.5fr] items-center border-b border-[#222] py-3 text-xs text-[#888] last:border-0" key={plan.name}>
            <span className="flex items-center gap-2 text-[#ccc]"><span className="h-1.5 w-1.5 rounded-full bg-[#FF5722]" />{plan.name}</span>
            <strong className="font-medium text-[#ccc]">{plan.purchases}</strong>
            <strong className="font-medium text-[#ccc]">{plan.revenue.toLocaleString()} {currency}</strong>
            <span className="text-emerald-400">{plan.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
