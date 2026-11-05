import React from "react";

interface DashboardServersSkeletonProps {
  rows?: number;
}

export function DashboardServersSkeleton({ rows = 4 }: DashboardServersSkeletonProps) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between pt-7 px-5">
        <div className="space-y-2">
          <div className="w-20 h-5 bg-[#222] rounded animate-pulse" />
          <div className="w-32 h-3 bg-[#222] rounded animate-pulse" />
        </div>
      </div>

      <div className="w-full">
        <div className="hidden gap-4 grid-cols-[1.5fr_1fr_1fr_100px_80px_80px_80px_100px] border-b border-white/[0.06] px-5 pb-3 xl:grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-12 h-2.5 bg-[#222] rounded animate-pulse" />
              <div className="w-3 h-3 bg-[#222] rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="divide-y divide-white/[0.06]">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 px-5 py-5 xl:grid xl:grid-cols-[1.5fr_1fr_1fr_100px_80px_80px_80px_100px] xl:items-center"
            >
              <div className="min-w-0 space-y-1">
                <div className="w-32 h-4 bg-[#2a2a2a] rounded animate-pulse mb-1" />
                <div className="w-24 h-2.5 bg-[#222] rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-[#2a2a2a] rounded-sm animate-pulse" />
                <div className="w-20 h-4 bg-[#2a2a2a] rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#2a2a2a] rounded animate-pulse" />
                <div className="w-24 h-4 bg-[#2a2a2a] rounded animate-pulse" />
              </div>
              <div>
                <div className="w-16 h-5 bg-[#2a2a2a] rounded animate-pulse" />
              </div>
              <div>
                <div className="w-12 h-4 bg-[#2a2a2a] rounded animate-pulse" />
              </div>
              <div>
                <div className="w-16 h-4 bg-[#2a2a2a] rounded animate-pulse" />
              </div>
              <div>
                <div className="w-16 h-4 bg-[#2a2a2a] rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <div className="w-7 h-7 bg-white/[0.02] border border-white/[0.04] rounded animate-pulse" />
                <div className="w-7 h-7 bg-white/[0.02] border border-white/[0.04] rounded animate-pulse" />
                <div className="w-7 h-7 bg-[#202020] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DashboardServersSkeleton;
