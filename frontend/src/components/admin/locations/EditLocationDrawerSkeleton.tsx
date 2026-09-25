/**
 * Edit Location Drawer Skeleton
 */

import React from 'react';

export function EditLocationDrawerSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden px-1 pb-6 animate-in fade-in duration-300">
      <div className="space-y-8">
        <div className="space-y-5">
          <div>
            <div className="h-4 w-32 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-3 w-48 rounded bg-white/[0.02] animate-pulse" />
          </div>
          <div>
            <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
          </div>
          <div>
            <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-white/[0.02] border border-[#222] animate-pulse shrink-0" />
              <div className="flex-1 h-[44px] rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
            </div>
          </div>
          <div>
            <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
          </div>
          <div>
            <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
          </div>
        </div>

        <div className="border-t border-white/[0.06]" />

        <div className="space-y-5">
          <div>
            <div className="h-4 w-40 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-3 w-48 rounded bg-white/[0.02] animate-pulse" />
          </div>
          <div>
            <div className="h-3 w-32 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="h-3 w-20 rounded bg-white/[0.03] animate-pulse mb-1.5" />
              <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
            </div>
            <div>
              <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
              <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
            </div>
          </div>
          <div>
            <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
          </div>
        </div>

        <div className="border-t border-white/[0.06]" />

        <div className="space-y-5">
          <div>
            <div className="h-4 w-32 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-3 w-64 rounded bg-white/[0.02] animate-pulse mb-4" />
          </div>
          <div className="border-t border-white/[0.06] divide-y divide-white/[0.06]">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[72px] w-full bg-white/[0.015] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
