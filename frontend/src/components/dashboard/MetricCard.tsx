import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  bottomLabel: string;
  bottomValue: string;
  icon: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  subtitle,
  bottomLabel,
  bottomValue,
  icon
}: MetricCardProps) {
  return (
    <div className="flex flex-col px-6 py-5 sm:border-r sm:border-white/[0.06] last:border-r-0">
      <div className="flex items-center gap-2 text-[#888888] text-[10px] font-medium uppercase tracking-widest">
        <span className="text-[#555]">{icon}</span> {title}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-white">{value}</span>
        {subtitle && <span className="text-[#666] text-xs font-medium">{subtitle}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="text-[#555]">{bottomLabel}:</span>
        <span className="text-[#888888] font-medium">{bottomValue}</span>
      </div>
    </div>
  );
}
