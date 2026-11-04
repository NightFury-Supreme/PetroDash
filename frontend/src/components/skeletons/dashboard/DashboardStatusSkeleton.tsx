import React from "react";

export function DashboardStatusSkeleton() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 border-b border-white/[0.06] divide-y divide-white/[0.06] lg:divide-y-0">
      <div className="lg:col-span-2 lg:border-r lg:border-white/[0.06]">
        <div className="flex flex-col h-[350px] overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#222] rounded animate-pulse" />
              <div className="w-24 h-4 bg-[#222] rounded animate-pulse" />
            </div>
            <div className="w-24 h-6 bg-[#222] rounded-md animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-hidden pr-2">
            <div className="flex-1 space-y-6 mt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-6 last:mb-0">
                  <div className="flex justify-between mb-2">
                    <div className="w-24 h-4 bg-[#222] rounded animate-pulse" />
                    <div className="w-16 h-4 bg-[#222] rounded animate-pulse" />
                  </div>
                  <div className="w-full h-6 bg-[#222] rounded animate-pulse mb-2" />
                  <div className="flex justify-between items-center">
                    <div className="w-16 h-3 bg-[#222] rounded animate-pulse" />
                    <div className="flex-1 h-[1px] bg-[#222] mx-2" />
                    <div className="w-20 h-3 bg-[#222] rounded animate-pulse" />
                    <div className="flex-1 h-[1px] bg-[#222] mx-2" />
                    <div className="w-12 h-3 bg-[#222] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="flex flex-col h-[350px] p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#222] rounded animate-pulse" />
              <div className="w-24 h-4 bg-[#222] rounded animate-pulse" />
            </div>
          </div>

          <div className="flex-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="mb-6 last:mb-0">
                <div className="flex justify-between mb-2">
                  <div className="w-16 h-3 bg-[#222] rounded animate-pulse" />
                  <div className="w-12 h-3 bg-[#222] rounded animate-pulse" />
                </div>
                <div className="w-full h-3 bg-[#222] rounded-[1px] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardStatusSkeleton;
