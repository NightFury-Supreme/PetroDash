import React from 'react';

export function AdminLedgerTableSkeleton() {
  const cols = 'lg:grid-cols-[1.3fr_1.5fr_1.2fr_100px_100px_110px_90px]';

  return (
    <div className="w-full">
      <div className={`hidden gap-4 ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 lg:grid items-center`}>
        <div className="h-2.5 w-16 bg-[#222] rounded animate-pulse" />
        <div className="h-2.5 w-16 bg-[#222] rounded animate-pulse" />
        <div className="h-2.5 w-14 bg-[#222] rounded animate-pulse" />
        <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
        <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
        <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
        <div className="h-2.5 w-10 bg-[#222] rounded animate-pulse ml-auto" />
      </div>

      <div className="divide-y divide-white/[0.06]">
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className={`flex flex-col gap-4 px-5 py-5 transition hover:bg-white/[0.015] lg:grid ${cols} lg:items-center`}
          >
            <div className="flex flex-col justify-center">
              <div className="h-3.5 w-32 bg-[#2a2a2a] rounded animate-pulse" />
              <div className="h-2.5 w-24 bg-[#222] rounded animate-pulse mt-1" />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#202020] border border-white/[0.06] animate-pulse" />
              <div className="min-w-0">
                <div className="h-3 w-24 bg-[#2a2a2a] rounded animate-pulse" />
                <div className="h-2.5 w-32 bg-[#222] rounded animate-pulse mt-1" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-3.5 w-20 bg-[#2a2a2a] rounded animate-pulse" />
            </div>

            <div className="flex items-center">
              <div className="h-3.5 w-14 bg-[#2a2a2a] rounded animate-pulse" />
            </div>

            <div className="flex items-center gap-1.5">
              <div className="h-4 w-16 bg-[#2a2a2a] rounded animate-pulse" />
            </div>

            <div className="flex items-center">
              <div className="h-5 w-16 bg-[#2a2a2a] rounded animate-pulse" />
            </div>

            <div className="flex items-center gap-1.5 justify-end mt-2 lg:mt-0">
              <div className="w-7 h-7 bg-white/[0.02] border border-white/[0.04] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminLedgerTableSkeleton;
