import React from 'react';

export function GiftCodesTableSkeleton() {
  return (
    <div className="min-w-0 flex-1 flex flex-col">
      <div className="hidden gap-4 grid-cols-[1.8fr_1fr_1fr_70px_90px_80px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 items-center lg:grid">
        <div className="h-2 w-12 bg-[#222] rounded animate-pulse" />
        <div className="h-2 w-16 bg-[#222] rounded animate-pulse" />
        <div className="h-2 w-14 bg-[#222] rounded animate-pulse" />
        <div className="h-2 w-10 bg-[#222] rounded animate-pulse" />
        <div className="h-2 w-12 bg-[#222] rounded animate-pulse" />
        <div className="h-2 w-12 bg-[#222] rounded animate-pulse justify-self-end" />
      </div>

      <div className="divide-y divide-white/[0.06]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="hidden lg:grid gap-4 grid-cols-[1.8fr_1fr_1fr_70px_90px_80px] items-center px-5 py-5">
              <div className="space-y-1.5">
                <div className="h-3.5 w-32 rounded bg-[#2a2a2a] animate-pulse" />
                <div className="h-2.5 w-20 rounded bg-[#222] animate-pulse" />
              </div>
              <div className="h-3.5 w-20 rounded bg-[#2a2a2a] animate-pulse" />
              <div className="h-3.5 w-24 rounded bg-[#222] animate-pulse" />
              <div className="h-3.5 w-10 rounded bg-[#2a2a2a] animate-pulse" />
              <div className="h-5 w-14 rounded bg-[#2a2a2a] animate-pulse" />
              <div className="flex justify-end">
                <div className="w-7 h-7 bg-white/[0.02] border border-white/[0.04] rounded animate-pulse" />
              </div>
            </div>

            <div className="p-4 lg:hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="h-3.5 w-32 rounded bg-[#2a2a2a] animate-pulse" />
                  <div className="h-2.5 w-24 rounded bg-[#222] animate-pulse" />
                </div>
                <div className="h-6 w-16 shrink-0 rounded bg-[#2a2a2a] animate-pulse" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-1.5">
                    <div className="h-2.5 w-12 rounded bg-[#222] animate-pulse" />
                    <div className="h-3.5 w-16 rounded bg-[#2a2a2a] animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="mt-4 h-8 w-full rounded border border-white/[0.06] bg-[#202020] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GiftCodesTableSkeleton;
