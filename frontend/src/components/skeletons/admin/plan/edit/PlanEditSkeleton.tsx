import React from 'react';

export function PlanEditSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#202020] border border-white/[0.06] rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 bg-[#2a2a2a] rounded w-32 animate-pulse" />
            <div className="h-4 bg-[#222] rounded w-48 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 bg-[#202020] rounded animate-pulse" />
            <div className="h-6 bg-[#2a2a2a] rounded w-40 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-[#222] rounded w-20 animate-pulse" />
                <div className="h-10 bg-[#141414] border border-white/[0.06] rounded-lg animate-pulse" />
              </div>
            ))}
            <div className="flex items-center gap-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#222] rounded animate-pulse" />
                  <div className="h-4 bg-[#222] rounded w-24 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 bg-[#202020] rounded animate-pulse" />
            <div className="h-6 bg-[#2a2a2a] rounded w-36 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-[#222] rounded w-16 animate-pulse" />
                <div className="h-10 bg-[#141414] border border-white/[0.06] rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-[#202020] rounded animate-pulse" />
              <div className="h-6 bg-[#2a2a2a] rounded w-20 animate-pulse" />
            </div>
            <div className="h-9 bg-[#202020] border border-white/[0.06] rounded-lg w-32 animate-pulse" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-white/[0.06] rounded-lg">
                <div className="h-10 bg-[#141414] border border-white/[0.06] rounded-lg flex-1 animate-pulse" />
                <div className="h-10 bg-[#141414] border border-white/[0.06] rounded-lg flex-1 animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#222] rounded animate-pulse" />
                  <div className="h-4 bg-[#222] rounded w-16 animate-pulse" />
                </div>
                <div className="h-9 bg-[#202020] border border-white/[0.06] rounded-lg w-9 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <div className="h-10 bg-[#202020] border border-white/[0.06] rounded-lg w-24 animate-pulse" />
          <div className="h-10 bg-[#2a2a2a] rounded-lg w-32 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default PlanEditSkeleton;
