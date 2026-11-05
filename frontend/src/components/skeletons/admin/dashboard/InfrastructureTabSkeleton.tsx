import React from 'react';
import { DashboardMetricsSkeleton } from './DashboardMetricsSkeleton';

export function InfrastructureTabSkeleton() {
  return (
    <div className="space-y-6">
      <DashboardMetricsSkeleton count={4} />

      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <div className="mb-4">
          <div className="h-[10px] w-32 bg-[#222] rounded animate-pulse mb-1.5" />
          <div className="h-5 w-36 bg-[#2a2a2a] rounded animate-pulse mb-1" />
          <div className="h-3 w-56 bg-[#222] rounded animate-pulse" />
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          {Array.from({ length: 2 }).map((_, i) => (
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
          <div className="h-5 w-44 bg-[#2a2a2a] rounded animate-pulse mb-1" />
          <div className="h-3 w-72 bg-[#222] rounded animate-pulse" />
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#2a2a2a] rounded-full animate-pulse" />
              <div className="w-20 h-3 bg-[#222] rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-[330px] mt-4 w-full bg-[#141414] rounded-xl border border-white/[0.06] animate-pulse" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-white/[0.06] divide-y divide-white/[0.06] lg:divide-y-0">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="flex flex-col p-6 lg:border-r lg:border-white/[0.06] last:border-r-0">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="h-[10px] w-32 bg-[#222] rounded animate-pulse mb-1.5" />
                <div className="h-5 w-36 bg-[#2a2a2a] rounded animate-pulse mb-1" />
                <div className="h-3 w-48 bg-[#222] rounded animate-pulse" />
              </div>
              <div className="w-4 h-4 bg-[#222] rounded animate-pulse" />
            </div>
            <div className="flex flex-col mt-2">
              {Array.from({ length: 4 }).map((__, i) => (
                <div key={i} className="mb-4 last:mb-0">
                  <div className="mb-1.5 flex justify-between">
                    <div className="w-24 h-3.5 bg-[#2a2a2a] rounded animate-pulse" />
                    <div className="w-8 h-3.5 bg-[#222] rounded animate-pulse" />
                  </div>
                  <div className="w-full h-2 bg-[#222] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default InfrastructureTabSkeleton;
