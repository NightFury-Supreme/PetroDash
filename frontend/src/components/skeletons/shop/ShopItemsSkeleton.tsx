import React from 'react';

interface ShopItemsSkeletonProps {
  rows?: number;
}

export function ShopItemsSkeleton({ rows = 5 }: ShopItemsSkeletonProps) {
  return (
    <section className="mt-8">
      <div className="mb-3">
        <div className="h-7 w-28 bg-[#2a2a2a] rounded animate-pulse" />
        <div className="h-3.5 w-56 bg-[#222] rounded animate-pulse mt-1" />
      </div>

      <div className="w-full">
        <div className="hidden gap-4 grid-cols-[2fr_1fr_1fr_80px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid">
          <div className="h-2.5 bg-[#222] rounded w-16 animate-pulse mt-0.5" />
          <div className="h-2.5 bg-[#222] rounded w-16 animate-pulse mt-0.5" />
          <div className="h-2.5 bg-[#222] rounded w-12 animate-pulse mt-0.5" />
          <div className="h-2.5 bg-[#222] rounded w-12 animate-pulse ml-auto mt-0.5" />
        </div>

        <div className="divide-y divide-white/[0.06]">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 px-5 py-4 md:grid md:grid-cols-[2fr_1fr_1fr_80px] md:items-center"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                  <div className="h-5 w-5 rounded bg-[#202020] animate-pulse" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="h-3.5 w-28 bg-[#2a2a2a] animate-pulse rounded" />
                  <div className="h-3 w-40 max-w-full bg-[#222] animate-pulse rounded" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-10 bg-[#2a2a2a] animate-pulse rounded" />
                <div className="h-3 w-6 bg-[#222] animate-pulse rounded" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 shrink-0 bg-[#222] animate-pulse rounded-full" />
                <div className="h-5 w-12 bg-[#2a2a2a] animate-pulse rounded" />
              </div>
              <div className="flex justify-end mt-2 md:mt-0">
                <div className="h-8 w-full md:w-16 bg-[#202020] border border-white/[0.06] animate-pulse rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between px-1">
        <div className="h-3 w-36 bg-[#222] rounded animate-pulse" />
        <div className="h-3 w-44 bg-[#222] rounded animate-pulse" />
      </div>
    </section>
  );
}

export default ShopItemsSkeleton;
