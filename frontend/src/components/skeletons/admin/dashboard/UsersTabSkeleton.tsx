import React from 'react';
import { DashboardMetricsSkeleton } from './DashboardMetricsSkeleton';

export function UsersTabSkeleton() {
  return (
    <div className="space-y-6">
      <DashboardMetricsSkeleton count={4} />

      <section className="flex flex-col p-6 border-b border-white/[0.06]">
        <div className="mb-4">
          <div className="h-[10px] w-28 bg-[#222] rounded animate-pulse mb-1.5" />
          <div className="h-5 w-32 bg-[#2a2a2a] rounded animate-pulse mb-1" />
          <div className="h-3 w-60 bg-[#222] rounded animate-pulse" />
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
    </div>
  );
}

export default UsersTabSkeleton;
