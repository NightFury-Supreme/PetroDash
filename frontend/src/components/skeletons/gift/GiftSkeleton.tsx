import React from "react";

export function GiftHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="space-y-2">
        <div className="h-7 bg-[#222] rounded w-48 animate-pulse"></div>
        <div className="h-4 bg-[#222] rounded w-64 animate-pulse"></div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-[110px] h-[34px] bg-[#1A0F0C] border border-[#FF5722]/30 rounded-md animate-pulse"></div>
      </div>
    </div>
  );
}

export function GiftRedeemSkeleton() {
  return (
    <section className="border-y border-white/[0.06] divide-y divide-white/[0.06] sm:divide-y-0 sm:grid sm:grid-cols-2">
      <div className="flex flex-col p-6 sm:border-r sm:border-white/[0.06]">
        {/* Icon + label skeleton */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A2A2A] bg-[#222] animate-pulse"></div>
          <div>
            <div className="h-4 bg-[#222] rounded w-32 animate-pulse mb-1"></div>
            <div className="h-3 bg-[#222] rounded w-64 animate-pulse"></div>
          </div>
        </div>

        {/* Input row skeleton */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="h-10 bg-[#151515] rounded-lg w-full animate-pulse border border-white/[0.06]"></div>
          </div>
          <div className="h-10 bg-[#1A0F0C] border border-[#FF5722]/30 rounded-lg w-24 animate-pulse"></div>
        </div>
      </div>
      
      <div className="flex flex-col justify-center p-6 bg-white/[0.01]">
        <div className="h-[14px] w-24 bg-[#1a1a1a] rounded animate-pulse mb-2"></div>
        <div className="space-y-2 mt-2">
           <div className="h-[14px] bg-[#1a1a1a] rounded w-full animate-pulse"></div>
           <div className="h-[14px] bg-[#1a1a1a] rounded w-full animate-pulse"></div>
           <div className="h-[14px] bg-[#1a1a1a] rounded w-2/3 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}

export function GiftCodesTableSkeleton() {
  return (
    <div className="min-w-0 flex-1 flex flex-col">
      {/* Table header */}
      <div className="hidden gap-4 grid-cols-[1.8fr_1fr_1fr_70px_90px_80px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:grid">
        <span>Code</span>
        <span>Reward</span>
        <span>Expires</span>
        <span>Uses</span>
        <span>Status</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            {/* DESKTOP */}
            <div className="hidden lg:grid gap-4 grid-cols-[1.8fr_1fr_1fr_70px_90px_80px] items-center px-5 py-5">
              <div className="space-y-1.5">
                <div className="h-3 w-32 animate-pulse rounded-sm bg-white/[0.04]" />
                <div className="h-2 w-20 animate-pulse rounded-sm bg-white/[0.04]" />
              </div>
              <div className="h-3 w-20 animate-pulse rounded-sm bg-white/[0.04]" />
              <div className="h-3 w-24 animate-pulse rounded-sm bg-white/[0.04]" />
              <div className="h-3 w-10 animate-pulse rounded-sm bg-white/[0.04]" />
              <div className="h-5 w-14 animate-pulse rounded bg-white/[0.04]" />
              <div className="flex justify-end">
                <div className="h-4 w-12 animate-pulse rounded-sm bg-white/[0.04]" />
              </div>
            </div>
            
            {/* MOBILE */}
            <div className="p-4 lg:hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="h-3.5 w-32 animate-pulse rounded-sm bg-white/[0.04]" />
                  <div className="h-2.5 w-24 animate-pulse rounded-sm bg-white/[0.04]" />
                </div>
                <div className="h-6 w-16 shrink-0 animate-pulse rounded bg-white/[0.04]" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-1.5">
                    <div className="h-2.5 w-12 animate-pulse rounded-sm bg-white/[0.04]" />
                    <div className="h-3 w-16 animate-pulse rounded-sm bg-white/[0.04]" />
                  </div>
                ))}
              </div>
              <div className="mt-4 h-8 w-full animate-pulse rounded border border-white/[0.06] bg-white/[0.02]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GiftCodesSkeleton() {
  return (
    <section>
      <div className="flex flex-col lg:flex-row gap-8 items-start pt-6">
        <aside className="w-full lg:w-48 shrink-0">
          <div className="sticky top-6">
            <div className="mb-4">
              <div className="h-3 bg-[#222] rounded w-20 mb-4 animate-pulse"></div>
            </div>
            <div className="space-y-1">
              <div className="h-9 bg-white/5 rounded-lg w-full animate-pulse"></div>
              <div className="h-9 bg-transparent rounded-lg w-full animate-pulse"></div>
            </div>
            <div className="mt-8 pt-4">
              <div className="space-y-2">
                <div className="h-2 bg-[#222] rounded w-full animate-pulse"></div>
                <div className="h-2 bg-[#222] rounded w-4/5 animate-pulse"></div>
              </div>
            </div>
          </div>
        </aside>
        
        <div className="flex-1 min-w-0 w-full dashboard-content-wrapper mb-6">
          <div className="mb-4">
            <div className="h-3 bg-[#222] rounded w-24 mb-1 animate-pulse"></div>
            <div className="h-5 bg-[#222] rounded w-40 mt-1 animate-pulse"></div>
            <div className="h-3 bg-[#222] rounded w-72 mt-2 animate-pulse"></div>
          </div>
          
          <div className="mt-4">
             <GiftCodesTableSkeleton />
          </div>
        </div>
      </div>
    </section>
  );
}

export function GiftSkeleton() {
  return (
    <div className="flex flex-col h-full space-y-6">
      <GiftHeaderSkeleton />
      <GiftRedeemSkeleton />
      <GiftCodesSkeleton />
    </div>
  );
}
