import React from 'react';

export function OverviewSkeleton() {
  return (
    <div className="w-full">
      <div className="divide-y divide-white/[0.06]">
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_auto] md:items-start">
            <div className="flex items-center gap-3.5">
              <div className="w-[52px] h-[52px] rounded-full bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
              <div>
                <div className="h-4 w-16 rounded bg-[#2a2a2a] animate-pulse" />
                <div className="h-3 w-44 rounded bg-[#222] mt-1.5 animate-pulse" />
              </div>
            </div>
            <div className="flex min-w-0 items-center md:justify-end gap-2 h-9">
              <div className="h-3.5 w-14 rounded bg-[#2a2a2a] animate-pulse" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_auto] md:items-start">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                <div className="h-4 w-4 rounded bg-[#222] animate-pulse" />
              </div>
              <div>
                <div className="h-4 w-20 rounded bg-[#2a2a2a] animate-pulse" />
                <div className="h-3 w-36 rounded bg-[#222] mt-1.5 animate-pulse" />
              </div>
            </div>
            <div className="flex min-w-0 items-center md:justify-end gap-2 h-9">
              <div className="h-3.5 w-24 rounded bg-[#2a2a2a] animate-pulse" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_auto] md:items-start">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                <div className="h-4 w-4 rounded bg-[#222] animate-pulse" />
              </div>
              <div>
                <div className="h-4 w-20 rounded bg-[#2a2a2a] animate-pulse" />
                <div className="h-3 w-40 rounded bg-[#222] mt-1.5 animate-pulse" />
              </div>
            </div>
            <div className="flex min-w-0 items-center md:justify-end gap-2 h-9">
              <div className="h-3.5 w-28 rounded bg-[#2a2a2a] animate-pulse" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_auto] md:items-start">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                <div className="h-4 w-4 rounded bg-[#222] animate-pulse" />
              </div>
              <div>
                <div className="h-4 w-28 rounded bg-[#2a2a2a] animate-pulse" />
                <div className="h-3 w-48 rounded bg-[#222] mt-1.5 animate-pulse" />
              </div>
            </div>
            <div className="flex min-w-0 items-center md:justify-end gap-2 h-9">
              <div className="h-3.5 w-36 rounded bg-[#2a2a2a] animate-pulse" />
              <div className="h-4 w-4 rounded-full bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OverviewSkeleton;
