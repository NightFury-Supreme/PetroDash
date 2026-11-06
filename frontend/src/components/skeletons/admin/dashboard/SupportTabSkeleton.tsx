import React from 'react';
import { DashboardMetricsSkeleton } from './DashboardMetricsSkeleton';

export function SupportTabSkeleton() {
  return (
    <div className="space-y-6">
      <DashboardMetricsSkeleton count={4} />

      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <div className="mb-4">
          <div className="h-[10px] w-32 bg-[#222] rounded animate-pulse mb-1.5" />
          <div className="h-5 w-36 bg-[#2a2a2a] rounded animate-pulse mb-1" />
          <div className="h-3 w-64 bg-[#222] rounded animate-pulse" />
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#2a2a2a] rounded-full animate-pulse" />
              <div className="w-16 h-3 bg-[#222] rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-[330px] mt-4 w-full bg-[#141414] rounded-xl border border-white/[0.06] animate-pulse" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-white/[0.06] divide-y divide-white/[0.06] lg:divide-y-0">
        <div className="flex flex-col p-6 lg:border-r lg:border-white/[0.06] last:border-r-0">
          <div className="mb-4">
            <div className="h-[10px] w-32 bg-[#222] rounded animate-pulse mb-1.5" />
            <div className="h-5 w-40 bg-[#2a2a2a] rounded animate-pulse mb-1" />
            <div className="h-3 w-48 bg-[#222] rounded animate-pulse" />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8 mt-4">
            <div className="relative h-40 w-40 shrink-0 flex items-center justify-center">
              <div className="w-36 h-36 rounded-full border-8 border-white/[0.06] bg-transparent animate-pulse" />
            </div>
            <div className="flex w-full flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#2a2a2a] animate-pulse" />
                    <div className="w-16 h-3 bg-[#222] rounded animate-pulse" />
                  </div>
                  <div className="w-8 h-3.5 bg-[#2a2a2a] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col p-6 lg:border-r lg:border-white/[0.06] last:border-r-0">
          <div className="mb-4">
            <div className="h-[10px] w-36 bg-[#222] rounded animate-pulse mb-1.5" />
            <div className="h-5 w-48 bg-[#2a2a2a] rounded animate-pulse mb-1" />
            <div className="h-3 w-52 bg-[#222] rounded animate-pulse" />
          </div>
          <div className="flex gap-12 mt-4 mb-2">
            <div className="flex flex-col gap-1.5">
              <div className="h-[10px] w-24 bg-[#222] rounded animate-pulse" />
              <div className="h-8 w-16 bg-[#2a2a2a] rounded animate-pulse" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-[10px] w-24 bg-[#222] rounded animate-pulse" />
              <div className="h-8 w-16 bg-[#2a2a2a] rounded animate-pulse" />
            </div>
          </div>
          <div className="h-[190px] mt-4 w-full bg-[#141414] rounded-xl border border-white/[0.06] animate-pulse" />
        </div>
      </section>
    </div>
  );
}

export default SupportTabSkeleton;
