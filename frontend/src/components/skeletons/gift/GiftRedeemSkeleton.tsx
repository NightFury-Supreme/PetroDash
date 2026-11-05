import React from 'react';

export function GiftRedeemSkeleton() {
  return (
    <section className="border-y border-white/[0.06] divide-y divide-white/[0.06] sm:divide-y-0 sm:grid sm:grid-cols-2">
      <div className="flex flex-col p-6 sm:border-r sm:border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-[#202020] animate-pulse" />
          <div>
            <div className="h-4 bg-[#2a2a2a] rounded w-32 animate-pulse mb-1" />
            <div className="h-3 bg-[#222] rounded w-64 animate-pulse" />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="h-10 bg-[#141414] rounded-lg w-full animate-pulse border border-white/[0.06]" />
          </div>
          <div className="h-10 bg-[#202020] border border-white/[0.06] rounded-lg w-24 animate-pulse" />
        </div>
      </div>

      <div className="flex flex-col justify-center p-6 bg-white/[0.01]">
        <div className="h-[14px] w-24 bg-[#222] rounded animate-pulse mb-2" />
        <div className="space-y-2 mt-2">
          <div className="h-[14px] bg-[#222] rounded w-full animate-pulse" />
          <div className="h-[14px] bg-[#222] rounded w-full animate-pulse" />
          <div className="h-[14px] bg-[#222] rounded w-2/3 animate-pulse" />
        </div>
      </div>
    </section>
  );
}

export default GiftRedeemSkeleton;
