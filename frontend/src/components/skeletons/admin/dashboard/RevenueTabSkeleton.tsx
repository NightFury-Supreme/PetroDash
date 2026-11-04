import React from 'react';
import { DashboardMetricsSkeleton } from './DashboardMetricsSkeleton';

export function RevenueTabSkeleton() {
  return (
    <div className="space-y-6">
      <DashboardMetricsSkeleton count={4} />

      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <div className="mb-4">
          <div className="h-[10px] w-20 bg-[#222] rounded animate-pulse mb-1.5" />
          <div className="h-5 w-40 bg-[#2a2a2a] rounded animate-pulse mb-1" />
          <div className="h-3 w-64 bg-[#222] rounded animate-pulse" />
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#2a2a2a] rounded-full animate-pulse" />
              <div className="w-16 h-3 bg-[#222] rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-[330px] mt-4 w-full bg-[#141414] rounded-xl border border-white/[0.06] animate-pulse" />
      </section>

      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <div className="mb-4">
          <div className="h-[10px] w-28 bg-[#222] rounded animate-pulse mb-1.5" />
          <div className="h-5 w-36 bg-[#2a2a2a] rounded animate-pulse mb-1" />
          <div className="h-3 w-72 bg-[#222] rounded animate-pulse" />
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#2a2a2a] rounded-full animate-pulse" />
              <div className="w-20 h-3 bg-[#222] rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-[330px] mt-4 w-full bg-[#141414] rounded-xl border border-white/[0.06] animate-pulse" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-white/[0.06] divide-y divide-white/[0.06] lg:divide-y-0">
        <div className="flex flex-col p-6 lg:border-r lg:border-white/[0.06] last:border-r-0">
          <div className="mb-4">
            <div className="h-[10px] w-28 bg-[#222] rounded animate-pulse mb-1.5" />
            <div className="h-5 w-36 bg-[#2a2a2a] rounded animate-pulse mb-1" />
            <div className="h-3 w-56 bg-[#222] rounded animate-pulse" />
          </div>
          <div className="w-full">
            <div className="grid grid-cols-[1.4fr_.8fr_.9fr_.5fr] items-center border-b border-white/[0.06] pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-3 w-16 bg-[#222] rounded animate-pulse" />
              ))}
            </div>
            <div className="flex flex-col divide-y divide-white/[0.06]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[1.4fr_.8fr_.9fr_.5fr] items-center py-3.5">
                  <div className="h-3.5 w-24 bg-[#2a2a2a] rounded animate-pulse" />
                  <div className="h-3.5 w-10 bg-[#222] rounded animate-pulse" />
                  <div className="h-3.5 w-16 bg-[#222] rounded animate-pulse" />
                  <div className="h-3.5 w-8 bg-[#2a2a2a] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col p-6 lg:border-r lg:border-white/[0.06] last:border-r-0">
          <div className="mb-4">
            <div className="h-[10px] w-28 bg-[#222] rounded animate-pulse mb-1.5" />
            <div className="h-5 w-36 bg-[#2a2a2a] rounded animate-pulse mb-1" />
            <div className="h-3 w-56 bg-[#222] rounded animate-pulse" />
          </div>
          <div className="h-[250px] mt-4 w-full bg-[#141414] rounded-xl border border-white/[0.06] animate-pulse" />
        </div>
      </section>
    </div>
  );
}

export default RevenueTabSkeleton;
