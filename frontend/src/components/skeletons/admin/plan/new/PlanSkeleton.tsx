import React from 'react';

export function PlanSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#202020] border border-white/[0.06] rounded-lg animate-pulse" />
        <div className="w-16 h-16 bg-[#202020] border border-white/[0.06] rounded-2xl animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 bg-[#2a2a2a] rounded w-48 animate-pulse" />
          <div className="h-5 bg-[#222] rounded w-80 animate-pulse" />
        </div>
      </div>

      <div className="space-y-8">
        <div className="border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 bg-[#202020] rounded animate-pulse" />
            <div className="h-6 bg-[#2a2a2a] rounded w-40 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="h-4 bg-[#222] rounded w-20 animate-pulse" />
              <div className="h-10 bg-[#141414] border border-white/[0.06] rounded-lg animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-[#222] rounded w-16 animate-pulse" />
              <div className="h-10 bg-[#141414] border border-white/[0.06] rounded-lg animate-pulse" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <div className="h-4 bg-[#222] rounded w-24 animate-pulse" />
              <div className="h-20 bg-[#141414] border border-white/[0.06] rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        <div className="border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 bg-[#202020] rounded animate-pulse" />
            <div className="h-6 bg-[#2a2a2a] rounded w-48 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-[#222] rounded w-24 animate-pulse" />
                <div className="h-10 bg-[#141414] border border-white/[0.06] rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 bg-[#202020] rounded animate-pulse" />
            <div className="h-6 bg-[#2a2a2a] rounded w-36 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-[#222] rounded w-20 animate-pulse" />
                <div className="h-10 bg-[#141414] border border-white/[0.06] rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 bg-[#202020] rounded animate-pulse" />
            <div className="h-6 bg-[#2a2a2a] rounded w-32 animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-4 bg-[#222] rounded w-24 animate-pulse" />
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="p-3 border border-white/[0.06] rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-[#202020] rounded mt-1 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#2a2a2a] rounded w-32 animate-pulse" />
                      <div className="h-3 bg-[#222] rounded w-64 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanSkeleton;
