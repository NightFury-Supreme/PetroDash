import React from "react";

export function DashboardStatsSkeleton() {
  return (
    <section className="grid grid-cols-1 border-y border-white/[0.06] divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex flex-col px-6 py-5 sm:border-r sm:border-white/[0.06] last:border-r-0">
          <div className="flex items-center gap-2">
            <div className="w-[14px] h-[14px] bg-[#222] rounded animate-pulse" />
            <div className="w-16 h-3 bg-[#222] rounded animate-pulse" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <div className="w-12 h-7 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="w-8 h-3 bg-[#222] rounded animate-pulse" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-10 h-3 bg-[#222] rounded animate-pulse" />
            <div className="w-12 h-3 bg-[#222] rounded animate-pulse" />
          </div>
        </div>
      ))}
    </section>
  );
}

export default DashboardStatsSkeleton;
