import React from 'react';

export function SecuritySkeleton() {
  return (
    <div className="w-full">
      <div className="divide-y divide-white/[0.06]">
        <div className="px-5 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                <div className="h-4 w-4 rounded bg-[#222] animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="h-4 w-24 rounded bg-[#2a2a2a] animate-pulse" />
                <div className="h-3 w-48 rounded bg-[#222] mt-1.5 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-4 md:shrink-0 justify-end">
              <div className="h-9 w-32 rounded-lg bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                <div className="h-4 w-4 rounded bg-[#222] animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="h-4 w-28 rounded bg-[#2a2a2a] animate-pulse" />
                <div className="h-3 w-56 rounded bg-[#222] mt-1.5 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-4 md:shrink-0 justify-end">
              <div className="h-5 w-16 rounded-full bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                <div className="h-4 w-4 rounded bg-[#222] animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="h-4 w-48 rounded bg-[#2a2a2a] animate-pulse" />
                <div className="h-3 w-64 rounded bg-[#222] mt-1.5 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-4 md:shrink-0 justify-end">
              <div className="h-6 w-11 rounded-full bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecuritySkeleton;
