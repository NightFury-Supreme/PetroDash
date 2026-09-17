import React from 'react';

export function EarnSkeleton() {
  const cols = "lg:grid-cols-[2fr_100px_100px_120px_150px]";
  return (
    <div className="flex flex-col h-full space-y-6 text-white">
        <header>
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#FF5722]">Earn</h1>
              <p className="mt-1 text-sm text-white/40">
                Watch rewarded videos and complete tasks to earn coins.
              </p>
            </div>
          </div>
        </header>
        <div className="w-full">
          <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}>
            <span>Method</span>
            <span>Reward</span>
            <span>Daily Limit</span>
            <span>Cooldown</span>
            <span className="text-right">Action</span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] ${cols} lg:items-center`}>
                <div className="min-w-0 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse shrink-0" />
                  <div className="flex flex-col gap-2 w-full">
                    <div className="h-4 w-24 sm:w-32 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-32 sm:w-48 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="mb-2 h-2 w-12 bg-white/5 rounded animate-pulse lg:hidden" />
                  <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="mb-2 h-2 w-16 bg-white/5 rounded animate-pulse lg:hidden" />
                  <div className="h-4 w-12 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="mb-2 h-2 w-16 bg-white/5 rounded animate-pulse lg:hidden" />
                  <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
                  <div className="flex flex-wrap lg:justify-end gap-2">
                    <div className="h-7 w-20 bg-white/5 rounded-md animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}
