import React from 'react';

export default function AdminGiftRedemptionsSkeleton() {
  return (
    <div className="-mx-6 sm:-mx-8 animate-pulse">
      <div className="hidden gap-4 grid-cols-[1.5fr_1.5fr_1fr] border-b border-white/[0.06] px-6 sm:px-8 pb-3 pt-4 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid">
        <div className="h-2.5 w-16 bg-[#222] rounded" />
        <div className="h-2.5 w-16 bg-[#222] rounded" />
        <div className="h-2.5 w-20 bg-[#222] rounded ml-auto" />
      </div>

      <div className="divide-y divide-white/[0.06]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="group grid grid-cols-1 gap-4 px-6 sm:px-8 py-4 md:grid-cols-[1.5fr_1.5fr_1fr] md:items-center">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-[#202020] border border-white/[0.06]" />
              <div className="h-3.5 w-24 bg-[#2a2a2a] rounded" />
            </div>
            <div>
              <div className="h-3 w-32 bg-[#222] rounded" />
            </div>
            <div className="flex justify-end">
              <div className="h-3.5 w-20 bg-[#2a2a2a] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
