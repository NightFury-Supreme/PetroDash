import React from 'react';

export default function AdminGiftRedemptionsSkeleton() {
  return (
    <div className="w-full animate-pulse">
      {/* Skeleton header */}
      <div className="hidden gap-4 grid-cols-[1.5fr_1.5fr_1fr] border-b border-white/[0.06] px-6 sm:px-8 pb-3 pt-4 md:grid">
        <div className="h-2 w-16 bg-[#222] rounded"></div>
        <div className="h-2 w-16 bg-[#222] rounded"></div>
        <div className="h-2 w-20 bg-[#222] rounded ml-auto"></div>
      </div>
      
      {/* Skeleton rows */}
      <div className="divide-y divide-white/[0.06]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="group grid grid-cols-1 gap-4 px-6 sm:px-8 py-4 md:grid-cols-[1.5fr_1.5fr_1fr] md:items-center">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-[#222]"></div>
              <div className="h-3 w-24 bg-[#222] rounded"></div>
            </div>
            <div>
              <div className="h-3 w-32 bg-[#222] rounded"></div>
            </div>
            <div className="flex justify-end">
              <div className="h-3 w-20 bg-[#222] rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
